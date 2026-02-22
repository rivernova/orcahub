package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	mappers "github.com/rivernova/orcahub/internal/docker/images/api/mappers"
	requests "github.com/rivernova/orcahub/internal/docker/images/api/requests"
	responses "github.com/rivernova/orcahub/internal/docker/images/api/responses"
	domain "github.com/rivernova/orcahub/internal/docker/images/domain"
	model "github.com/rivernova/orcahub/internal/docker/images/model"
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
	c.JSON(http.StatusOK, mappers.ToImageResponseList(images))
}

func (h *Handler) Inspect(c *gin.Context) {
	id := c.Param("id")
	image, err := h.service.Inspect(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mappers.ToImageInspectResponse(image))
}

func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	var query requests.RemoveImageRequest
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	result, err := h.service.Delete(c.Request.Context(), id, model.RemoveOptions{
		Force:         query.Force,
		PruneChildren: query.PruneChildren,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, responses.RemoveImageResponse{Deleted: result.Deleted, Untagged: result.Untagged})
}

func (h *Handler) Pull(c *gin.Context) {
	var req requests.PullImageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	opts := model.PullOptions{Image: req.Image}
	if req.Auth != nil {
		opts.Auth = &model.RegistryAuth{
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
	var req requests.BuildImageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	result, err := h.service.Build(c.Request.Context(), model.BuildOptions{
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
	c.JSON(http.StatusCreated, responses.BuildImageResponse{
		ImageID:  result.ImageID,
		Tags:     result.Tags,
		Warnings: result.Warnings,
	})
}
