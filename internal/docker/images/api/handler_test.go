package api_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	imageapi "github.com/rivernova/orcahub/internal/docker/images/api"
	"github.com/rivernova/orcahub/internal/docker/images/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func init() { gin.SetMode(gin.TestMode) }

type mockImageService struct{ mock.Mock }

func (m *mockImageService) List(ctx context.Context) ([]model.Image, error) {
	args := m.Called(ctx)
	return args.Get(0).([]model.Image), args.Error(1)
}
func (m *mockImageService) Inspect(ctx context.Context, id string) (*model.Image, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Image), args.Error(1)
}
func (m *mockImageService) Delete(ctx context.Context, id string, opts model.RemoveOptions) (*model.RemoveResult, error) {
	args := m.Called(ctx, id, opts)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.RemoveResult), args.Error(1)
}
func (m *mockImageService) Pull(ctx context.Context, opts model.PullOptions) error {
	return m.Called(ctx, opts).Error(0)
}
func (m *mockImageService) Build(ctx context.Context, opts model.BuildOptions) (*model.BuildResult, error) {
	args := m.Called(ctx, opts)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.BuildResult), args.Error(1)
}

func setupImageRouter(svc *mockImageService) *gin.Engine {
	r := gin.New()
	h := imageapi.NewHandler(svc)
	r.GET("/images", h.List)
	r.GET("/images/:id", h.Inspect)
	r.DELETE("/images/:id", h.Delete)
	r.POST("/images/pull", h.Pull)
	r.POST("/images/build", h.Build)
	return r
}

func TestImageHandler_List_OK(t *testing.T) {
	svc := &mockImageService{}
	r := setupImageRouter(svc)

	svc.On("List", mock.Anything).Return([]model.Image{
		{ID: "sha256:aaa", Tags: []string{"nginx:latest"}},
	}, nil)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/images", nil))

	assert.Equal(t, http.StatusOK, w.Code)
	var resp []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Len(t, resp, 1)
}

func TestImageHandler_List_Error(t *testing.T) {
	svc := &mockImageService{}
	r := setupImageRouter(svc)

	svc.On("List", mock.Anything).Return([]model.Image{}, errors.New("daemon error"))

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/images", nil))

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestImageHandler_Inspect_OK(t *testing.T) {
	svc := &mockImageService{}
	r := setupImageRouter(svc)

	svc.On("Inspect", mock.Anything, "sha256:abc").Return(
		&model.Image{ID: "sha256:abc", Os: "linux", Architecture: "amd64"}, nil,
	)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/images/sha256:abc", nil))

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "linux", resp["os"])
}

func TestImageHandler_Inspect_NotFound(t *testing.T) {
	svc := &mockImageService{}
	r := setupImageRouter(svc)

	svc.On("Inspect", mock.Anything, "sha256:nope").Return(nil, errors.New("image not found"))

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/images/sha256:nope", nil))

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestImageHandler_Delete_OK(t *testing.T) {
	svc := &mockImageService{}
	r := setupImageRouter(svc)

	svc.On("Delete", mock.Anything, "sha256:abc", mock.AnythingOfType("model.RemoveOptions")).
		Return(&model.RemoveResult{Deleted: []string{"sha256:abc"}}, nil)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/images/sha256:abc", nil))

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestImageHandler_Pull_OK(t *testing.T) {
	svc := &mockImageService{}
	r := setupImageRouter(svc)

	svc.On("Pull", mock.Anything, mock.AnythingOfType("model.PullOptions")).Return(nil)

	body, _ := json.Marshal(map[string]string{"image": "nginx:latest"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/images/pull", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestImageHandler_Pull_BadRequest(t *testing.T) {
	svc := &mockImageService{}
	r := setupImageRouter(svc)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/images/pull", bytes.NewBufferString("bad json"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestImageHandler_Build_OK(t *testing.T) {
	svc := &mockImageService{}
	r := setupImageRouter(svc)

	svc.On("Build", mock.Anything, mock.AnythingOfType("model.BuildOptions")).
		Return(&model.BuildResult{ImageID: "sha256:new", Tags: []string{"myapp:latest"}}, nil)

	body, _ := json.Marshal(map[string]interface{}{
		"tag":     "myapp:latest",
		"context": "/tmp/project",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/images/build", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "sha256:new", resp["image_id"])
}
