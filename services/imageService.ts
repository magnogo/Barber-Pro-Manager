
/**
 * Serviço para upload de imagens via API ImgBB
 */

const IMGBB_API_KEY = "e6939ed568d1dbaa3f0253d793e0cceb";
const UPLOAD_URL = "https://api.imgbb.com/1/upload";

export const uploadImageToImgBB = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${UPLOAD_URL}?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Falha no upload para ImgBB');
    }

    const json = await response.json();
    
    if (json.success) {
      // Retorna a display_url que é otimizada para visualização direta
      return json.data.display_url;
    }
    
    return null;
  } catch (error) {
    console.error('[ImgBB] Erro no upload:', error);
    return null;
  }
};
