# Troubleshooting Guide

## Changes Not Reflecting After Deployment

If your code changes aren't reflecting after pushing and running the pipeline, follow these steps:

### Quick Fix (Manual Deployment)

```bash
# Navigate to the app directory
cd /home/your-user/csediualumni-services

# Stop all containers
docker-compose down

# Remove old containers
docker-compose rm -f

# Pull the latest image from Docker Hub
docker pull <your-dockerhub-username>/csediualumni-services:latest

# Start with force recreate
docker-compose up -d --force-recreate --no-build

# Check if container is running
docker-compose ps

# View logs to confirm changes
docker-compose logs --tail=50
```

### Verify the Changes

1. **Check Docker Image:**

   ```bash
   # List images with creation dates
   docker images | grep csediualumni-services

   # Inspect the image to see when it was built
   docker inspect <your-dockerhub-username>/csediualumni-services:latest | grep Created
   ```

2. **Check Container Logs:**

   ```bash
   docker-compose logs -f
   ```

3. **Test the Endpoint Directly:**

   ```bash
   # Test locally
   curl http://localhost:3000
   ```

4. **Check from Your Browser:**
   - Open developer tools (F12)
   - Go to Network tab
   - Check "Disable cache"
   - Visit your application URL
   - Or use Ctrl+Shift+R (Cmd+Shift+R on Mac) for hard refresh

### Common Issues and Solutions

#### Issue 1: Docker Using Cached Layers

**Solution:** The workflow now includes `--force-recreate` flag which will recreate containers even if nothing changed.

#### Issue 2: Old Image Not Replaced

**Solution:**

- The workflow now explicitly pulls the latest image before starting
- `pull_policy: always` in docker-compose.yml ensures it always checks for updates

#### Issue 3: Container Not Restarting

**Solution:**

- `docker-compose down` stops containers
- `docker-compose rm -f` removes them completely
- `--force-recreate` ensures fresh containers

#### Issue 4: Browser Cache

**Solution:**

- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Or open in incognito/private mode

### Check Pipeline Status

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Find the latest workflow run
4. Make sure all jobs (test, build) completed successfully
5. Check the build step logs for any errors

### Manual Verification Steps

After deployment, run these commands:

```bash
# Check Docker Hub for latest image timestamp
docker pull <your-dockerhub-username>/csediualumni-services:latest
docker inspect <your-dockerhub-username>/csediualumni-services:latest | grep Created

# Check running container
docker ps | grep csediualumni-services

# Check container creation time (should be recent)
docker inspect csediualumni-services | grep Created

# Test the response
curl http://localhost:3000
```

### Nuclear Option (Complete Clean Rebuild)

If nothing else works, do a complete cleanup:

```bash
# Stop everything
docker-compose down -v

# Remove all related containers
docker rm -f $(docker ps -a | grep csediualumni-services | awk '{print $1}')

# Remove all related images
docker rmi -f $(docker images | grep csediualumni-services | awk '{print $3}')

# Pull fresh image
docker pull <your-dockerhub-username>/csediualumni-services:latest

# Start clean
docker-compose up -d --force-recreate
```

### Still Not Working?

Check these:

1. **Verify the image was actually built with your changes:**
   - Go to Docker Hub: https://hub.docker.com
   - Check your repository's latest push timestamp
   - Should match your GitHub Actions run time

2. **Check GitHub Actions workflow:**
   - Make sure the build job succeeded
   - Make sure the image was pushed to Docker Hub

3. **Check your server:**
   - Make sure you have enough disk space: `df -h`
   - Make sure Docker is running: `docker ps`
   - Check system logs: `journalctl -u docker`

### Contact Points

If issues persist, provide these details:

- GitHub Actions workflow run URL
- Docker image creation timestamp from Docker Hub
- Container logs (`docker-compose logs`)
- Response from `curl http://localhost:3000` locally
