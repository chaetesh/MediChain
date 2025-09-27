# IPFS Configuration

This document outlines how to configure and run IPFS with Kubo in a Docker container for the MediChain application.

## Prerequisites

- Docker
- Docker Compose (optional, for easier management)

## Running IPFS Kubo in Docker

### 1. Pull the Kubo Docker Image

```bash
docker pull ipfs/kubo:latest
```

### 2. Create Data Directories

```bash
mkdir -p ~/.ipfs/data ~/.ipfs/staging
```

### 3. Run the IPFS Container

```bash
docker run -d --name ipfs-node \
  -v ~/.ipfs/data:/data/ipfs \
  -v ~/.ipfs/staging:/export \
  -p 4001:4001 -p 5001:5001 -p 8080:8080 \
  ipfs/kubo:latest
```

This command:
- `-d`: Runs the container in the background
- `--name ipfs-node`: Names the container for easy reference
- `-v`: Mounts volumes for persistent data storage
- `-p`: Maps container ports to host ports:
  - `4001`: IPFS swarm port
  - `5001`: API port (used by our application)
  - `8080`: Gateway port (for HTTP access to IPFS content)

### 4. Verify the Node is Running

```bash
docker logs ipfs-node
```

You should see output indicating the node is running and connected to the IPFS network.

## Configuring the Application

The MediChain application connects to the IPFS node using the HTTP API. Ensure your `.env` file contains:

```
IPFS_API_URL=http://localhost:5001/api/v0
```

> Note: The Kubo IPFS API endpoint is at `/api/v0`, which must be included in the URL.

## Checking IPFS Health

You can check the health of your IPFS node using the API endpoint:

```
GET /api/ipfs/health
```

This will return information about the connected IPFS node.

## Testing IPFS Functionality

After starting both the IPFS node and the MediChain application, you can test file storage and retrieval:

1. Upload a medical record through the application
2. The file will be stored on IPFS with encryption
3. Check the response for the IPFS hash (CID) of the stored file
4. Access the file through the application's download endpoint

## Troubleshooting

### Connection Issues

If the application cannot connect to IPFS, check:

1. The IPFS container is running: `docker ps | grep ipfs-node`
2. The API port is accessible: `curl http://localhost:5001/api/v0/version`
3. CORS is properly configured (if needed):

```bash
docker exec ipfs-node ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
docker exec ipfs-node ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
docker restart ipfs-node
```

### File Size Limitations

For large files, the application uses chunking to handle the upload efficiently. The default chunk size is 1MB, but you can adjust this based on your requirements.

## Additional Resources

- [IPFS Kubo Documentation](https://docs.ipfs.tech/install/ipfs-desktop/)
- [IPFS HTTP API Reference](https://docs.ipfs.tech/reference/http/api/)
