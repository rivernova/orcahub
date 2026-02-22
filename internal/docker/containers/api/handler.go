package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	mappers "github.com/rivernova/orcahub/internal/docker/containers/api/mappers"
	requests "github.com/rivernova/orcahub/internal/docker/containers/api/requests"
	responses "github.com/rivernova/orcahub/internal/docker/containers/api/responses"
	domain "github.com/rivernova/orcahub/internal/docker/containers/domain"
	model "github.com/rivernova/orcahub/internal/docker/containers/model"
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
	c.JSON(http.StatusOK, mappers.ToContainerResponseList(containers))
}

func (h *Handler) Inspect(c *gin.Context) {
	id := c.Param("id")
	container, err := h.service.Inspect(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mappers.ToContainerInspectResponse(container))
}

func (h *Handler) Create(c *gin.Context) {
	var req requests.CreateContainerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	result, err := h.service.Create(c.Request.Context(), mappers.ToDomainContainer(req))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, responses.CreateContainerResponse{ID: result.ID})
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
	var req requests.StopContainerRequest
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
	var query requests.LogsQueryRequest
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	logs, err := h.service.Logs(c.Request.Context(), id, model.LogsOptions{
		Since:  query.Since,
		Until:  query.Until,
		Tail:   query.Tail,
		Follow: query.Follow,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, responses.LogsResponse{Logs: logs})
}

func (h *Handler) Stats(c *gin.Context) {
	id := c.Param("id")
	stats, err := h.service.Stats(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mappers.ToStatsResponse(stats))
}

func (h *Handler) Exec(c *gin.Context) {
	id := c.Param("id")
	var req requests.ExecRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	result, err := h.service.Exec(c.Request.Context(), id, model.ExecOptions{
		Command:      req.Command,
		AttachStdout: req.AttachStdout,
		AttachStderr: req.AttachStderr,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, responses.ExecResponse{Output: result.Output, ExitCode: result.ExitCode})
}
