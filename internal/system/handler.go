package system

import (
	"context"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/docker/docker/client"
	"github.com/gin-gonic/gin"

	response "github.com/rivernova/orcahub/internal/system/response"
)

type Handler struct{}

func NewHandler() *Handler { return &Handler{} }

func (h *Handler) Status(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()
	c.JSON(http.StatusOK, response.StatusResponse{
		Docker:     detectDocker(ctx),
		Kubernetes: detectKubernetes(),
	})
}

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
		return response.KubernetesStatus{Available: false, Error: "kubectl not available or no context"}
	}
	currentCtx := strings.TrimSpace(string(ctxOut))

	clusterCmd := exec.Command("kubectl", "cluster-info", "--request-timeout=3s")
	clusterOut, err := clusterCmd.Output()
	if err != nil {
		return response.KubernetesStatus{Available: false, Context: currentCtx, Error: "cluster unreachable: " + err.Error()}
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
