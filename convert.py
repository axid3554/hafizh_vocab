import csv
import json

def convert_csv_to_json():
    with open('kosakata.csv', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Skip first 2 lines
    if len(lines) < 4:
        return
        
    reader = csv.reader(lines[2:])
    headers = next(reader)
    
    keyMap = {
      'ID *': 'id',
      'Kata Arab *': 'kata_arab',
      'Transliterasi *': 'transliterasi',
      'Arti (ID) *': 'arti',
      'Arti (EN)': 'arti_en',
      'Jenis Kata *': 'jenis_kata',
      'Ket Kata': 'keterangan',
      'Frekuensi': 'frekuensi',
      'Contoh Ayat (Arab)': 'contoh_ayat_ar',
      'Contoh Ayat (ID)': 'contoh_ayat_id',
      'Contoh Ayat (EN)': 'contoh_ayat_en',
      'Nama Surat': 'nama_surat',
      'No. Ayat': 'nomor_ayat',
      'Status *': 'status_verifikasi',
    }
    
    keys = [keyMap.get(h.strip(), h.strip().lower().replace(' ', '_')) for h in headers]
    
    data = []
    for row in reader:
        if not row or not row[0]:
            continue
        obj = {}
        for idx, key in enumerate(keys):
            if idx < len(row):
                obj[key] = row[idx].strip()
            else:
                obj[key] = ""
        data.append(obj)
        
    with open('kosakata.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    convert_csv_to_json()
