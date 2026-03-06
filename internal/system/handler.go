package system

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/events"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/client"
	"github.com/gin-gonic/gin"

	response "github.com/rivernova/orcahub/internal/system/response"
)

type Handler struct {
	client *client.Client
}

func NewHandler() *Handler {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return &Handler{}
	}
	return &Handler{client: cli}
}

// Status — GET /api/system/status
func (h *Handler) Status(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()
	c.JSON(http.StatusOK, response.StatusResponse{
		Docker:     detectDocker(ctx),
		Kubernetes: detectKubernetes(),
	})
}

// Detect — GET /api/system/detect
func (h *Handler) Detect(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	result := gin.H{"docker": false, "k8s": false}

	if h.client != nil {
		if _, err := h.client.ServerVersion(ctx); err == nil {
			result["docker"] = true
		}
	}

	k8s := detectKubernetes()
	if k8s.Available {
		result["k8s"] = true
		result["k8s_context"] = k8s.Context
		result["k8s_server"] = k8s.ServerInfo
	}

	c.JSON(http.StatusOK, result)
}

// Info — GET /api/system/info
func (h *Handler) Info(c *gin.Context) {
	if h.client == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "docker client not available"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	info, err := h.client.Info(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ver, _ := h.client.ServerVersion(ctx)

	c.JSON(http.StatusOK, gin.H{
		"containers":         info.Containers,
		"containers_running": info.ContainersRunning,
		"containers_paused":  info.ContainersPaused,
		"containers_stopped": info.ContainersStopped,
		"images":             info.Images,
		"server_version":     ver.Version,
		"api_version":        ver.APIVersion,
		"os":                 info.OperatingSystem,
		"arch":               info.Architecture,
		"kernel_version":     info.KernelVersion,
		"cpus":               info.NCPU,
		"memory_bytes":       info.MemTotal,
		"docker_root_dir":    info.DockerRootDir,
		"storage_driver":     info.Driver,
		"logging_driver":     info.LoggingDriver,
		"cgroup_driver":      info.CgroupDriver,
		"runtime":            info.DefaultRuntime,
		"name":               info.Name,
	})
}

// DiskUsage — GET /api/system/disk-usage
func (h *Handler) DiskUsage(c *gin.Context) {
	if h.client == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "docker client not available"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	du, err := h.client.DiskUsage(ctx, types.DiskUsageOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var containersSize, imagesSize, volumesSize, buildCacheSize int64
	for _, ct := range du.Containers {
		containersSize += ct.SizeRw
	}
	for _, img := range du.Images {
		imagesSize += img.Size
	}
	for _, v := range du.Volumes {
		volumesSize += v.UsageData.Size
	}
	for _, bc := range du.BuildCache {
		buildCacheSize += bc.Size
	}

	c.JSON(http.StatusOK, gin.H{
		"containers_count": len(du.Containers),
		"containers_size":  containersSize,
		"images_count":     len(du.Images),
		"images_size":      imagesSize,
		"volumes_count":    len(du.Volumes),
		"volumes_size":     volumesSize,
		"build_cache_size": buildCacheSize,
		"total_size":       containersSize + imagesSize + volumesSize + buildCacheSize,
	})
}

// Prune — POST /api/system/prune
func (h *Handler) Prune(c *gin.Context) {
	if h.client == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "docker client not available"})
		return
	}

	ctx := c.Request.Context()
	var totalReclaimed uint64

	containerReport, _ := h.client.ContainersPrune(ctx, filters.Args{})
	containersDeleted := containerReport.ContainersDeleted
	totalReclaimed += containerReport.SpaceReclaimed

	imageReport, _ := h.client.ImagesPrune(ctx, filters.NewArgs(
		filters.Arg("dangling", "false"),
	))
	imagesDeleted := len(imageReport.ImagesDeleted)
	totalReclaimed += imageReport.SpaceReclaimed

	volumeReport, _ := h.client.VolumesPrune(ctx, filters.Args{})
	volumesDeleted := volumeReport.VolumesDeleted
	totalReclaimed += volumeReport.SpaceReclaimed

	networkReport, _ := h.client.NetworksPrune(ctx, filters.Args{})
	networksDeleted := networkReport.NetworksDeleted

	c.JSON(http.StatusOK, gin.H{
		"reclaimed":          totalReclaimed,
		"containers_deleted": containersDeleted,
		"images_deleted":     imagesDeleted,
		"volumes_deleted":    volumesDeleted,
		"networks_deleted":   networksDeleted,
	})
}

// Events — GET /api/system/events (SSE stream)
func (h *Handler) Events(c *gin.Context) {
	if h.client == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "docker client not available"})
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	ctx, cancel := context.WithCancel(c.Request.Context())
	defer cancel()

	eventsChan, errChan := h.client.Events(ctx, events.ListOptions{})

	c.Stream(func(w io.Writer) bool {
		select {
		case event, ok := <-eventsChan:
			if !ok {
				return false
			}
			data := fmt.Sprintf(
				`{"type":"%s","action":"%s","actor":{"id":"%s","name":"%s"},"time":%d}`,
				event.Type, event.Action,
				event.Actor.ID,
				event.Actor.Attributes["name"],
				event.Time,
			)
			fmt.Fprintf(w, "data: %s\n\n", data)
			return true
		case err, ok := <-errChan:
			if ok && err != nil {
				fmt.Fprintf(w, "data: {\"error\":\"%s\"}\n\n", err.Error())
			}
			return false
		case <-ctx.Done():
			return false
		}
	})
}

// helpers (mismos que los originales)
func detectDocker(ctx context.Context) response.DockerStatus {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return response.DockerStatus{Available: false, Error: err.Error()}
	}
	defer cli.Close()
	ver, err := cli.ServerVersion(ctx)
	if err != nil {
		return response.DockerStatus{Available: false, Error: err.Error()}
	}
	return response.DockerStatus{Available: true, Version: ver.Version}
}

func detectKubernetes() response.KubernetesStatus {
	kubeconfigPath := os.Getenv("KUBECONFIG")
	if kubeconfigPath == "" {
		home, _ := os.UserHomeDir()
		kubeconfigPath = home + "/.kube/config"
	}
	if _, err := os.Stat(kubeconfigPath); os.IsNotExist(err) {
		return response.KubernetesStatus{Available: false, Error: "no kubeconfig found"}
	}
	ctxCmd := exec.Command("kubectl", "config", "current-context")
	ctxOut, err := ctxCmd.Output()
	if err != nil {
		return response.KubernetesStatus{Available: false, Error: "kubectl not available"}
	}
	currentCtx := strings.TrimSpace(string(ctxOut))
	clusterCmd := exec.Command("kubectl", "cluster-info", "--request-timeout=3s")
	clusterOut, err := clusterCmd.Output()
	if err != nil {
		return response.KubernetesStatus{
			Available: false, Context: currentCtx,
			Error: "cluster unreachable: " + err.Error(),
		}
	}
	serverInfo := ""
	if lines := strings.Split(string(clusterOut), "\n"); len(lines) > 0 {
		serverInfo = stripANSI(lines[0])
	}
	return response.KubernetesStatus{Available: true, Context: currentCtx, ServerInfo: serverInfo}
}

func stripANSI(s string) string {
	var result []byte
	skip := false
	for i := 0; i < len(s); i++ {
		if s[i] == '\x1b' {
			skip = true
			continue
		}
		if skip {
			if (s[i] >= 'A' && s[i] <= 'Z') || (s[i] >= 'a' && s[i] <= 'z') {
				skip = false
			}
			continue
		}
		result = append(result, s[i])
	}
	return string(result)
}
