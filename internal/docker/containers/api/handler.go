package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rivernova/orcahub/internal/docker/containers/domain"
)

type Handler struct {
	service domain.ContainerService
}

func NewHandler(service domain.ContainerService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) List(c *gin.Context) {
	containers, err := h.service.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toContainerResponseList(containers))
}

func (h *Handler) Inspect(c *gin.Context) {
	id := c.Param("id")
	container, err := h.service.Inspect(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toContainerInspectResponse(container))
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateContainerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	result, err := h.service.Create(c.Request.Context(), toDomainContainer(req))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, CreateContainerResponse{ID: result.ID})
}

func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *Handler) Start(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.Start(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "container started"})
}

func (h *Handler) Stop(c *gin.Context) {
	id := c.Param("id")
	var req StopContainerRequest
	_ = c.ShouldBindJSON(&req)
	if err := h.service.Stop(c.Request.Context(), id, req.Timeout); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "container stopped"})
}

func (h *Handler) Restart(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.Restart(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "container restarted"})
}

func (h *Handler) Logs(c *gin.Context) {
	id := c.Param("id")
	var query LogsQueryRequest
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	logs, err := h.service.Logs(c.Request.Context(), id, domain.LogsOptions{
		Since:  query.Since,
		Until:  query.Until,
		Tail:   query.Tail,
		Follow: query.Follow,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, LogsResponse{Logs: logs})
}

func (h *Handler) Stats(c *gin.Context) {
	id := c.Param("id")
	stats, err := h.service.Stats(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toStatsResponse(stats))
}

func (h *Handler) Exec(c *gin.Context) {
	id := c.Param("id")
	var req ExecRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	result, err := h.service.Exec(c.Request.Context(), id, domain.ExecOptions{
		Command:      req.Command,
		AttachStdout: req.AttachStdout,
		AttachStderr: req.AttachStderr,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ExecResponse{Output: result.Output, ExitCode: result.ExitCode})
}
