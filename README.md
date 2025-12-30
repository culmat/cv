# CV/Resume Site

A Jekyll-based CV/resume website using the [Modern Resume Theme](https://github.com/sproogen/modern-resume-theme).

## Prerequisites

- [Colima](https://github.com/abiosoft/colima) for Docker runtime: `brew install colima docker docker-compose`
- Start Colima: `colima start`

## Local Development

1. Start Jekyll server:
   ```bash
   ./restart.sh
   ```

2. Open your browser to `http://localhost:4000`

3. Make changes and restart:
   - Edit `_config.yml` or theme files
   - Stop server with `Ctrl+C`
   - Run `./restart.sh` again

## Theme Development

Switch between theme sources:
```bash
./switchtheme.sh local      # Local theme development from ../modern-resume-theme
./switchtheme.sh sproogen   # Original theme
./switchtheme.sh culmat     # Your fork
```

Run `./switchtheme.sh` without parameters to see status and options.

## Deployment

Push changes to the `gh-pages` branch. GitHub Pages automatically builds and deploys your site using its built-in Jekyll build process.

## Customization

Edit the `_config.yml` file to personalize your CV content. All CV data is stored in YAML format within this file.
