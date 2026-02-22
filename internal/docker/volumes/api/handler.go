package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	domain "github.com/rivernova/orcahub/internal/docker/volumes/domain"
	model "github.com/rivernova/orcahub/internal/docker/volumes/model"
)

type Handler struct {
	service domain.VolumeService
}

func NewHandler(service domain.VolumeService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) List(c *gin.Context) {
	volumes, err := h.service.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toVolumeResponseList(volumes))
}

func (h *Handler) Inspect(c *gin.Context) {
	name := c.Param("name")
	volume, err := h.service.Inspect(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toVolumeInspectResponse(volume))
}

func (h *Handler) Create(c *gin.Context) {
	var req CreateVolumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	result, err := h.service.Create(c.Request.Context(), model.CreateVolumeOptions{
		Name:       req.Name,
		Driver:     req.Driver,
		DriverOpts: req.DriverOpts,
		Labels:     req.Labels,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, toVolumeResponse(*result))
}

func (h *Handler) Delete(c *gin.Context) {
	name := c.Param("name")
	if err := h.service.Delete(c.Request.Context(), name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
