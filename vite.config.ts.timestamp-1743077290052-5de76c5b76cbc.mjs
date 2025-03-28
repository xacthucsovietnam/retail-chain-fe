// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  server: {
    proxy: {
      "/api": {
        target: "https://app.xts.vn",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, "/dungbaby-service/hs/apps/execute/xts"),
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.error("Proxy error:", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            proxyReq.setHeader("Accept", "*/*");
            proxyReq.setHeader("Accept-Encoding", "gzip, deflate, br, zstd");
            proxyReq.setHeader("Accept-Language", "en-US,en;q=0.9,vi;q=0.8,vi-VN;q=0.7");
            proxyReq.setHeader("Content-Type", "text/plain;charset=UTF-8");
            proxyReq.setHeader("Origin", "https://cool-clafoutis-0474e4.netlify.app");
            proxyReq.setHeader("Referer", "https://cool-clafoutis-0474e4.netlify.app/");
            proxyReq.setHeader("Priority", "u=1, i");
            proxyReq.setHeader("Sec-Fetch-Dest", "empty");
            proxyReq.setHeader("Sec-Fetch-Mode", "cors");
            proxyReq.setHeader("Sec-Fetch-Site", "cross-site");
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log("Response Status:", proxyRes.statusCode);
          });
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGV4Y2x1ZGU6IFsnbHVjaWRlLXJlYWN0J10sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9hcHAueHRzLnZuJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICBzZWN1cmU6IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnL2R1bmdiYWJ5LXNlcnZpY2UvaHMvYXBwcy9leGVjdXRlL3h0cycpLFxuICAgICAgICBjb25maWd1cmU6IChwcm94eSwgX29wdGlvbnMpID0+IHtcbiAgICAgICAgICBwcm94eS5vbignZXJyb3InLCAoZXJyLCBfcmVxLCBfcmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdQcm94eSBlcnJvcjonLCBlcnIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcScsIChwcm94eVJlcSwgcmVxLCBfcmVzKSA9PiB7XG4gICAgICAgICAgICBwcm94eVJlcS5zZXRIZWFkZXIoJ0FjY2VwdCcsICcqLyonKTtcbiAgICAgICAgICAgIHByb3h5UmVxLnNldEhlYWRlcignQWNjZXB0LUVuY29kaW5nJywgJ2d6aXAsIGRlZmxhdGUsIGJyLCB6c3RkJyk7XG4gICAgICAgICAgICBwcm94eVJlcS5zZXRIZWFkZXIoJ0FjY2VwdC1MYW5ndWFnZScsICdlbi1VUyxlbjtxPTAuOSx2aTtxPTAuOCx2aS1WTjtxPTAuNycpO1xuICAgICAgICAgICAgcHJveHlSZXEuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAndGV4dC9wbGFpbjtjaGFyc2V0PVVURi04Jyk7XG4gICAgICAgICAgICBwcm94eVJlcS5zZXRIZWFkZXIoJ09yaWdpbicsICdodHRwczovL2Nvb2wtY2xhZm91dGlzLTA0NzRlNC5uZXRsaWZ5LmFwcCcpO1xuICAgICAgICAgICAgcHJveHlSZXEuc2V0SGVhZGVyKCdSZWZlcmVyJywgJ2h0dHBzOi8vY29vbC1jbGFmb3V0aXMtMDQ3NGU0Lm5ldGxpZnkuYXBwLycpO1xuICAgICAgICAgICAgcHJveHlSZXEuc2V0SGVhZGVyKCdQcmlvcml0eScsICd1PTEsIGknKTtcbiAgICAgICAgICAgIHByb3h5UmVxLnNldEhlYWRlcignU2VjLUZldGNoLURlc3QnLCAnZW1wdHknKTtcbiAgICAgICAgICAgIHByb3h5UmVxLnNldEhlYWRlcignU2VjLUZldGNoLU1vZGUnLCAnY29ycycpO1xuICAgICAgICAgICAgcHJveHlSZXEuc2V0SGVhZGVyKCdTZWMtRmV0Y2gtU2l0ZScsICdjcm9zcy1zaXRlJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcHJveHkub24oJ3Byb3h5UmVzJywgKHByb3h5UmVzLCByZXEsIF9yZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZXNwb25zZSBTdGF0dXM6JywgcHJveHlSZXMuc3RhdHVzQ29kZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KSJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBRWxCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsY0FBYztBQUFBLEVBQzFCO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixTQUFTLENBQUMsU0FBUyxLQUFLLFFBQVEsVUFBVSx1Q0FBdUM7QUFBQSxRQUNqRixXQUFXLENBQUMsT0FBTyxhQUFhO0FBQzlCLGdCQUFNLEdBQUcsU0FBUyxDQUFDLEtBQUssTUFBTSxTQUFTO0FBQ3JDLG9CQUFRLE1BQU0sZ0JBQWdCLEdBQUc7QUFBQSxVQUNuQyxDQUFDO0FBQ0QsZ0JBQU0sR0FBRyxZQUFZLENBQUMsVUFBVSxLQUFLLFNBQVM7QUFDNUMscUJBQVMsVUFBVSxVQUFVLEtBQUs7QUFDbEMscUJBQVMsVUFBVSxtQkFBbUIseUJBQXlCO0FBQy9ELHFCQUFTLFVBQVUsbUJBQW1CLHFDQUFxQztBQUMzRSxxQkFBUyxVQUFVLGdCQUFnQiwwQkFBMEI7QUFDN0QscUJBQVMsVUFBVSxVQUFVLDJDQUEyQztBQUN4RSxxQkFBUyxVQUFVLFdBQVcsNENBQTRDO0FBQzFFLHFCQUFTLFVBQVUsWUFBWSxRQUFRO0FBQ3ZDLHFCQUFTLFVBQVUsa0JBQWtCLE9BQU87QUFDNUMscUJBQVMsVUFBVSxrQkFBa0IsTUFBTTtBQUMzQyxxQkFBUyxVQUFVLGtCQUFrQixZQUFZO0FBQUEsVUFDbkQsQ0FBQztBQUNELGdCQUFNLEdBQUcsWUFBWSxDQUFDLFVBQVUsS0FBSyxTQUFTO0FBQzVDLG9CQUFRLElBQUksb0JBQW9CLFNBQVMsVUFBVTtBQUFBLFVBQ3JELENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
