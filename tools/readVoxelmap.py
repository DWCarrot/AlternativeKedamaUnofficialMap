import zipfile
import os
import mmap
import re

class VoxelMapData:

    def __init__(self, file):
        self.tmpfolder = os.path.abspath(hex(id(self))[2:] + '/')
        with zipfile.ZipFile(file, 'r') as package:
            package.extractall(self.tmpfolder)
        datafile = os.path.join(self.tmpfolder, 'data')
        self.datasize = os.path.getsize(datafile)
        self.data = mmap.mmap(os.open(datafile, os.O_RDWR), self.datasize, access=mmap.ACCESS_READ)
        self.key = dict()
        pattern = re.compile(r'(\d+) (\w+)(\{\S+?\})(\[\S+?\])?')
        with open(os.path.join(self.tmpfolder, 'key'), 'rt') as keyfile:
            for line in keyfile:
                m = pattern.match(line)
                ind = int(m.group(1))
                value = dict()
                value[m.group(2)] = m.group(3)[1:-1]
                if m.lastindex > 3:
                    nbt = dict()
                    for part in m.group(4)[1:-1].split(','):
                        sp = part.index('=')
                        nbt[part[:sp]] = part[sp+1:]
                    value['nbt'] = nbt
                self.key[ind] = value
        pass
                
                
                
    def close(self):
        if self.data is not None:
            priint(self.data)
            self.data.close()
            self.data = None

    def __del__(self):
        self.close()
        os.remove(os.path.join(self.tmpfolder, 'data'))
        os.remove(os.path.join(self.tmpfolder, 'key'))
        os.rmdir(self.tmpfolder)
        print('deleted', hex(id(self))[2:])

os.chdir(r'E:\workspace\AlternativeKedamaUnofficialMap\tools')
