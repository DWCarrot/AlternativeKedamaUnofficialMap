import numpy as np
import cv2
from urllib import request
import re
import json

def _match(js):
    res = list()
    p = re.compile(r'\.add\(\"(-?\d+)(?:-(-?\d+))?,(-?\d+)(?:-(-?\d+))?\",\"(\S+?)\"\)')
    for m in p.finditer(js):
        x1 = m.group(1)
        x2 = m.group(2)
        if x2 is None:
            x2 = x1
        y1 = m.group(3)
        y2 = m.group(4)
        if y2 is None:
            y2 = y1
        color = m.group(5)
        res.append((int(x1), int(x2), int(y1), int(y2), color))
    return res
        

def load(fpath):
    return cv2.imread(fpath, cv2.IMREAD_UNCHANGED)

def loadFromURL():
    url = 'https://kucr.silentdepth.me/main.f630d99d.js'
    file = request.urlopen(url)
    data = file.read()
    res = _match(data.decode('utf-8'))
    print(res)
    del file
    w = 256
    h = 256
    s = 16
    img = np.zeros((h * s, w * s), 'uint8')
    colorTable = dict()
    colorIndex = 1
    for r in res:
        ci = colorTable.get(r[4])
        if not ci:
            colorTable[r[4]] = ci = colorIndex
            colorIndex += 1
        i1 = int((r[2] + h / 2) * s)
        j1 = int((r[0] + w / 2) * s)
        i2 = int((r[3] + 1 + h / 2) * s)
        j2 = int((r[1] + 1 + w / 2) * s)
        print(i1,i2,j1,j2)
        img[i1:i2,j1:j2] = ci
    return img, colorTable
    

def label(img, colorTable):
    bw = np.zeros(img.shape[0:2], 'uint8')
    rec = list()
    for k, v in colorTable.items():
        bw[:] = 0
        bw[img == np.uint8(v)] = 255
        bw, contours, hierarchy = cv2.findContours(bw, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)       
        for i, e in enumerate(contours):
            e = np.squeeze(e)
            rec.append( (e, np.uint8(v)) )
    return rec

def _rColor(s):
    if s[0] == '#':
        if len(s) == 3 + 1:
            s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]
        return s
    return s

def toDataJSON(rec, colorTable):
    w = 4096
    h = 4096
    ec = json.JSONEncoder()
    obj = dict()
    hw = np.int32(w / 2)
    hh = np.int32(h / 2)
    colorTable = {value:key for key, value in colorTable.items()}
    c = 0
    for r in rec:
        vox = r[0]
        vox[:,0] -= hw
        vox[:,1] -= hh
        c += 1 
        obj[c] = {'color': _rColor(colorTable.get(r[1])), 'vertex': np.flip(vox, 1).tolist()}
    return ec.encode(obj)  

def main():
    k = input('>> next')
    img, colorTable = loadFromURL()
    print()
    k = input('>> next')
    rec = label(img, colorTable)
    print()
    k = input('>> next')
    s = toDataJSON(rec, colorTable)
    print(s)
    print()
    k = input('>> save as: ')
    with open(k, 'w') as ofile:
        ofile.write(s)

if __name__ == '__main__':
    main()
    
