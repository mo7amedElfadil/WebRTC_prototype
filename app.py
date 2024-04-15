#!/usr/bin/python3
import flask
from flask import request, jsonify, render_template
import json
import requests

app = flask.Flask(__name__)

@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
