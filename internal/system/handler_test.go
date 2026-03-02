package system_test

import (
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/gin-gonic/gin"
    systemapi "github.com/rivernova/orcahub/internal/system"
    "github.com/stretchr/testify/assert"
)

func init() {
    gin.SetMode(gin.TestMode)
}

func setupSystemRouter() *gin.Engine {
    r := gin.New()
    h := systemapi.NewHandler()
    r.GET("/status", h.Status)
    return r
}

func TestSystemHandler_Status_ReturnsJSON(t *testing.T) {
    r := setupSystemRouter()

    w := httptest.NewRecorder()
    r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/status", nil))

    assert.Equal(t, http.StatusOK, w.Code)
    // should at least include top-level keys
    assert.Contains(t, w.Body.String(), "\"docker\"")
    assert.Contains(t, w.Body.String(), "\"kubernetes\"")
}
