#!/usr/bin/env python

import os
import logging

import flask
from flask_cors import cross_origin 

import cooperhewitt.roboteyes.colors.palette as palette
import cooperhewitt.flask.http_pony as http_pony

app = http_pony.setup_flask_app('PALETTE_SERVER')

@app.route('/ping', methods=['GET'])
@cross_origin(methods=['GET'])
def ping():

    return flask.jsonify({'stat': 'ok'})

@app.route('/extract/roygbiv/<reference>', methods=['GET', 'POST'])
@cross_origin(methods=['GET', 'POST'])
def extract_roygbiv(reference):

    try:
        if flask.request.method=='POST':
            path = http_pony.get_upload_path(app)
        else:
            path = http_pony.get_local_path(app)

    except Exception, e:

        logging.error(e)
        flask.abort(400)

    ok = True

    try:
        rsp = palette.extract_roygbiv(path, reference)
    except Exception, e:
        logging.error("Unable to extract colors, because %s" % e)
        ok = False

    if flask.request.method == 'POST':
        os.unlink(path)

    if not ok:
        flask.abort(500)

    return flask.jsonify(**rsp)
    
if __name__ == '__main__':

    http_pony.run_from_cli(app)
