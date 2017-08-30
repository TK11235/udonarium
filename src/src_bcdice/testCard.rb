Dir.chdir('./test')
command = "ruby -Ku testCard.rb #{ARGV.join(' ')}"
print command
print `#{command}`
