import * as ImageManipulator from 'expo-image-manipulator';

const OCR_API_URL = 'https://api.ocr.space/parse/image';
const OCR_API_KEY = 'helloworld';

type OcrSpaceResponse = {
  ParsedResults?: {
    ParsedText?: string;
  }[];
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ErrorDetails?: string;
};

export async function recognizeText(imageUri: string): Promise<string> {
  const manipulatedImage = await ImageManipulator.manipulateAsync(
    imageUri,
    [
      {
        resize: {
          width: 1600,
        },
      },
    ],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!manipulatedImage.base64) {
    throw new Error('No fue posible preparar la imagen para OCR.');
  }

  const formData = new FormData();

  formData.append('base64Image', `data:image/jpeg;base64,${manipulatedImage.base64}`);

  formData.append('language', 'spa');
  formData.append('isOverlayRequired', 'false');
  formData.append('OCREngine', '2');

  const response = await fetch(OCR_API_URL, {
    method: 'POST',
    headers: {
      apikey: OCR_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`El servicio OCR respondió con HTTP ${response.status}.`);
  }

  const result = (await response.json()) as OcrSpaceResponse;

  if (result.IsErroredOnProcessing) {
    const errorMessage = Array.isArray(result.ErrorMessage)
      ? result.ErrorMessage.join(' ')
      : result.ErrorMessage;

    throw new Error(errorMessage || 'OCR.Space no pudo procesar la imagen.');
  }

  return (
    result.ParsedResults?.map((item) => item.ParsedText ?? '')
      .join('\n')
      .trim() ?? ''
  );
}
