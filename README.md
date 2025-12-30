# CV/Resume Site

A Jekyll-based CV/resume website using the [Modern Resume Theme](https://github.com/sproogen/modern-resume-theme).

## Prerequisites

- Ruby 3.0+ (via rbenv, system Ruby, or your preferred method)
- Bundler

## Local Development

1. Install dependencies (first time only):
   ```bash
   bundle install
   ```

2. Start Jekyll server:
   ```bash
   ./restart.sh
   ```

3. Open your browser to `http://localhost:4000`

4. Make changes and restart:
   - Edit `_config.yml` or theme files
   - Stop server with `Ctrl+C`
   - Run `./restart.sh` again

## Theme Development

The modern-resume-theme is loaded as a local path gem from `../modern-resume-theme`, allowing you to modify both the theme and your CV content simultaneously.

To switch between theme sources (local, your fork, or original theme), use:
```bash
./switchtheme.sh
```

Run without parameters to see available options.

## Deployment

Push changes to the `gh-pages` branch. GitHub Pages automatically builds and deploys your site using its built-in Jekyll build process.

## Customization

Edit the `_config.yml` file to personalize your CV content. All CV data is stored in YAML format within this file.
