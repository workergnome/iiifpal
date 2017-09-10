#!/usr/bin/env python

from setuptools import setup

setup(name='plumbing-palette-server',
      version='0.22',
      description='A Flask-based HTTP pony for extracting colors from images',
      author='Cooper Hewitt Smithsonian Design Museum',
      url='https://github.com/cooperhewitt/plumbing-palette-server',
      requires=[
      ],
      install_requires=[
          'cooperhewitt.flask',
          'cooperhewitt.roboteyes.colors',
      ],
      packages=[],
      scripts=[
          'scripts/palette-server.py',
      ],
      download_url='https://github.com/cooperhewitt/plumbing-palette-server/tarball/master#egg=0.22',
      license='BSD')
