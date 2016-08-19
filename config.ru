# config.ru (run with rackup)
require './lib/app'

p1 = spawn "plumbing-palette-server/scripts/palette-server.py -c config/palette.ini"
Process.detach(p1)

run MyApp