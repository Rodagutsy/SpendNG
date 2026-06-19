import MlkitOcr from 'react-native-mlkit-ocr';
import * as ImagePicker from 'expo-image-picker';

export type ExtractedReceipt = {
  rawText: string;
  amount: string | null;
  merchant: string | null;
  date: string | null;
};

export async function scanReceipt(): Promise<ExtractedReceipt | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.9,
    allowsEditing: true,
  });

  if (result.canceled) return null;

  const uri = result.assets[0].uri;
  const blocks = await MlkitOcr.detectFromUri(uri);
  const rawText = blocks.map((b) => b.text).join('\n');

  return {
    rawText,
    amount: extractAmount(rawText),
    merchant: extractMerchant(rawText),
    date: extractDate(rawText),
  };
}

function extractAmount(text: string): string | null {
  const match = text.match(/(?:NGN|₦|N|#)\s?([\d,]+\.?\d*)/i);
  return match ? match[1].replace(/,/g, '') : null;
}

function extractMerchant(text: string): string | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines[0] ?? null;
}

function extractDate(text: string): string | null {
  const match = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
  return match ? match[1] : null;
}
