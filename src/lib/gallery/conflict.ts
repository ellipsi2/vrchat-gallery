interface DataElement {
    id: string;
    images: string[];
  }
  
  interface DuplicateInfo {
    a: string;
    b: string;
  }
  
  export function findDuplicateImages(data: DataElement[]): DuplicateInfo[] {
    const imageMap: Map<string, string[]> = new Map();
  
    // Populate the imageMap with images and their corresponding ids
    data.forEach((element) => {
      element.images.forEach((image) => {
        if (!imageMap.has(image)) {
          imageMap.set(image, []);
        }
        imageMap.get(image)?.push(element.id);
      });
    });
  
    const duplicates: DuplicateInfo[] = [];
    
    imageMap.forEach((ids) => {
      if (ids.length > 1) {
        for (let i = 0; i < ids.length - 1; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            duplicates.push({ a: ids[i], b: ids[j] });
          }
        }
      }
    });
  
    return duplicates;
  }