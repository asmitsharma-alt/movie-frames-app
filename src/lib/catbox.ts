/**
 * Uploads a file to Catbox.moe
 * Free, lifetime, direct-hotlinking image host
 */
export async function uploadToCatbox(file: File | Blob): Promise<string> {
  const formData = new FormData();
  formData.append('reqtype', 'fileupload');
  formData.append('fileToUpload', file);

  const response = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: formData,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Archive.Frame Film Stills Project)',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Catbox upload failed (${response.status}): ${errorText}`);
  }

  const url = (await response.text()).trim();
  
  if (!url.startsWith('http')) {
    throw new Error(`Invalid response from Catbox: ${url}`);
  }

  return url;
}
