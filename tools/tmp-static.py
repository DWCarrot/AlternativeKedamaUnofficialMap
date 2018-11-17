# -*- coding: utf-8 -*-

import http.server
import socketserver
import os

PORT = 28080

Handler = http.server.SimpleHTTPRequestHandler

os.chdir('../')

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()
