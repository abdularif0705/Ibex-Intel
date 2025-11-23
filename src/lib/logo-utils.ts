import logoImage from '@/assets/tsi-logo.png';

export async function getLogoAsBase64(): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const base64 = canvas.toDataURL('image/png');
      resolve(base64);
    };
    
    img.onerror = () => reject(new Error('Failed to load logo'));
    img.src = logoImage;
  });
}
