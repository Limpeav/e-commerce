# Automatic Product Image Background Removal

Product images selected in the admin Add Product and Edit Product pages are
automatically sent to remove.bg. The transparent result is stored in the
existing Cloudinary account.

## Configuration

1. Create an API key at https://www.remove.bg/api.
2. Add the key to the backend environment:

```env
REMOVE_BG_API_KEY=your_remove_bg_api_key
```

3. Add the same environment variable to the deployed backend service.
4. Restart or redeploy the backend.

If the key is missing, the quota is exhausted, or processing fails, the admin
form keeps the original image and displays a warning. Product creation and
editing can still continue with that original image.

The upload endpoint accepts images up to 10 MB. remove.bg usage is subject to
the limits and pricing of the configured remove.bg account.
