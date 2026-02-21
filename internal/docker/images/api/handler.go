package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rivernova/orcahub/internal/docker/images/domain"
)

type Handler struct {
	service domain.ImageService
}

func NewHandler(service domain.ImageService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) List(c *gin.Context) {
	images, err := h.service.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toImageResponseList(images))
}

func (h *Handler) Inspect(c *gin.Context) {
	id := c.Param("id")
	image, err := h.service.Inspect(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toImageInspectResponse(image))
}

func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	var query RemoveImageRequest
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	result, err := h.service.Delete(c.Request.Context(), id, domain.RemoveOptions{
		Force:         query.Force,
		PruneChildren: query.PruneChildren,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, RemoveImageResponse{Deleted: result.Deleted, Untagged: result.Untagged})
}

func (h *Handler) Pull(c *gin.Context) {
	var req PullImageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	opts := domain.PullOptions{Image: req.Image}
	if req.Auth != nil {
		opts.Auth = &domain.RegistryAuth{
			Username:      req.Auth.Username,
			Password:      req.Auth.Password,
			ServerAddress: req.Auth.ServerAddress,
		}
	}
	if err := h.service.Pull(c.Request.Context(), opts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "image pulled"})
}

func (h *Handler) Build(c *gin.Context) {
	var req BuildImageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	result, err := h.service.Build(c.Request.Context(), domain.BuildOptions{
		Tag:        req.Tag,
		Dockerfile: req.Dockerfile,
		Context:    req.Context,
		BuildArgs:  req.BuildArgs,
		Labels:     req.Labels,
		NoCache:    req.NoCache,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, BuildImageResponse{
		ImageID:  result.ImageID,
		Tags:     result.Tags,
		Warnings: result.Warnings,
	})
}
