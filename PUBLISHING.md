# Publishing DitaCraft to VS Code Marketplace

This guide explains how to publish the DitaCraft extension to the Visual Studio Code Marketplace.

## Prerequisites

### 1. Create a Publisher Account

1. Go to https://marketplace.visualstudio.com/manage
2. Sign in with your Microsoft account or create one
3. Click "Create publisher"
4. Fill in the required information:
   - **Publisher ID**: Choose a unique ID (e.g., `jyjeanne` or `jeremyjeanne`)
   - **Publisher name**: Your display name (e.g., "Jeremy Jeanne")
   - **Email**: Your contact email

### 2. Get a Personal Access Token (PAT)

1. Go to https://dev.azure.com
2. Sign in with the same Microsoft account
3. Click on your profile icon → "Personal access tokens"
4. Click "New Token"
5. Configure the token:
   - **Name**: "VS Code Marketplace"
   - **Organization**: All accessible organizations
   - **Expiration**: Choose duration (90 days, 1 year, etc.)
   - **Scopes**: Select "Marketplace" → Check "Manage"
6. Click "Create"
7. **IMPORTANT**: Copy the token immediately (you won't see it again!)

### 3. Update package.json

Update the `publisher` field in `package.json` with your Publisher ID:

```json
{
  "publisher": "your-publisher-id"
}
```

### 4. Install VSCE

VSCE (Visual Studio Code Extensions) is the command-line tool for publishing:

```bash
npm install -g @vscode/vsce
```

## Pre-Publishing Checklist

Before publishing, ensure:

- ✅ All code is committed and pushed to GitHub
- ✅ `package.json` version is correct (e.g., `0.1.0`)
- ✅ `CHANGELOG.md` is updated with all changes
- ✅ `README.md` is accurate and complete
- ✅ Extension icon (`resources/icon.png`) exists and is 128x128px
- ✅ All tests pass: `npm test`
- ✅ Code is linted: `npm run lint`
- ✅ Extension works when tested locally

## Publishing Steps

### Step 1: Login to VSCE

```bash
vsce login <your-publisher-id>
```

When prompted, paste your Personal Access Token.

### Step 2: Package the Extension

```bash
npm run package
```

This creates a `.vsix` file (e.g., `ditacraft-0.1.0.vsix`).

### Step 3: Test the Package

Install the package locally to verify everything works:

```bash
code --install-extension ditacraft-0.1.0.vsix
```

Test all features:
- Create new DITA files
- Validate files
- Preview HTML5
- Publish to different formats

### Step 4: Publish to Marketplace

```bash
npm run publish
```

Or manually:

```bash
vsce publish
```

**Important**: This will:
1. Increment the version number in `package.json`
2. Create a git tag
3. Publish to the marketplace

### Step 5: Verify Publication

1. Go to https://marketplace.visualstudio.com/manage
2. Find your extension in the list
3. Check that it appears correctly
4. Test installation from the marketplace:
   ```
   code --install-extension jyjeanne.ditacraft
   ```

## Publishing Options

### Publish Specific Version

To publish without auto-incrementing:

```bash
vsce publish --no-git-tag-version
```

### Publish with Version Bump

```bash
vsce publish patch  # 0.1.0 → 0.1.1
vsce publish minor  # 0.1.0 → 0.2.0
vsce publish major  # 0.1.0 → 1.0.0
```

### Publish Pre-release

```bash
vsce publish --pre-release
```

## Post-Publishing

### 1. Create GitHub Release

1. Go to https://github.com/jyjeanne/ditacraft/releases
2. Click "Create a new release"
3. Tag: `v0.1.0`
4. Title: "DitaCraft v0.1.0"
5. Description: Copy from CHANGELOG.md
6. Attach the `.vsix` file
7. Click "Publish release"

### 2. Update README Badges

Add marketplace badges to README.md:

```markdown
[![Version](https://img.shields.io/visual-studio-marketplace/v/jyjeanne.ditacraft)](https://marketplace.visualstudio.com/items?itemName=jyjeanne.ditacraft)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/jyjeanne.ditacraft)](https://marketplace.visualstudio.com/items?itemName=jyjeanne.ditacraft)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/jyjeanne.ditacraft)](https://marketplace.visualstudio.com/items?itemName=jyjeanne.ditacraft)
```

### 3. Announce the Release

- Update project documentation
- Share on social media
- Post in relevant communities
- Update your website/portfolio

## Updating the Extension

When publishing updates:

1. Make your changes and test thoroughly
2. Update `CHANGELOG.md` with new changes
3. Commit and push to GitHub
4. Run `vsce publish patch` (or `minor`/`major`)
5. Create a new GitHub release

## Troubleshooting

### Error: "Publisher not found"

- Verify you created a publisher at https://marketplace.visualstudio.com/manage
- Check the publisher ID in `package.json` matches exactly
- Make sure you're logged in: `vsce login <publisher-id>`

### Error: "PAT token invalid"

- Generate a new Personal Access Token
- Ensure "Marketplace" scope with "Manage" permission is selected
- Login again: `vsce login <publisher-id>`

### Error: "Extension package too large"

- Review `.vscodeignore` to exclude unnecessary files
- Remove development dependencies from production build
- Consider bundling with webpack/esbuild

### Error: "Extension name already taken"

- Choose a different extension name in `package.json`
- The name must be unique in the marketplace

## Best Practices

1. **Version Control**: Always commit changes before publishing
2. **Testing**: Test thoroughly in a clean VS Code installation
3. **Documentation**: Keep README and CHANGELOG up-to-date
4. **Semantic Versioning**: Follow semver (major.minor.patch)
5. **Quality**: Ensure code quality with linting and tests
6. **Security**: Never commit PAT tokens to git
7. **Backwards Compatibility**: Avoid breaking changes in minor/patch versions

## Resources

- [VS Code Publishing Documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [VSCE GitHub Repository](https://github.com/microsoft/vscode-vsce)
- [Marketplace Publisher Portal](https://marketplace.visualstudio.com/manage)
- [Azure DevOps](https://dev.azure.com)

## Quick Reference

```bash
# One-time setup
npm install -g @vscode/vsce
vsce login <publisher-id>

# Before each publish
npm install
npm run compile
npm run lint
npm test

# Publish
vsce publish patch   # For bug fixes
vsce publish minor   # For new features
vsce publish major   # For breaking changes

# Manual package and publish
npm run package
vsce publish --packagePath ./ditacraft-0.1.0.vsix
```

---

**Need Help?** Open an issue at https://github.com/jyjeanne/ditacraft/issues
