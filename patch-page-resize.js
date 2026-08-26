const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf-8');

const resizeFunc = `
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = 1024;
        if (width > max || height > max) {
          if (width > height) {
            height = Math.round((height * max) / width);
            width = max;
          } else {
            width = Math.round((width * max) / height);
            height = max;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
`;

code = code.replace("export default function WorkspacePage() {", resizeFunc + "\nexport default function WorkspacePage() {");

const handleUploadSearch = `  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      
      const reader = new FileReader();
      reader.onloadend = () => {
         setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };`;
const handleUploadReplace = `  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      try {
        const resizedBase64 = await resizeImage(file);
        setImageBase64(resizedBase64);
      } catch (err) {
        console.error("Failed to resize image", err);
      }
    }
  };`;
code = code.replace(handleUploadSearch, handleUploadReplace);

const onDropSearch = `                const file = e.dataTransfer.files?.[0];
                if (file) {
                  setUploadedImage(URL.createObjectURL(file));
                  const r = new FileReader();
                  r.onloadend = () => setImageBase64(r.result as string);
                  r.readAsDataURL(file);
                }`;
const onDropReplace = `                const file = e.dataTransfer.files?.[0];
                if (file) {
                  setUploadedImage(URL.createObjectURL(file));
                  resizeImage(file).then(setImageBase64).catch(err => console.error(err));
                }`;
code = code.replace(onDropSearch, onDropReplace);

fs.writeFileSync('app/page.tsx', code);
