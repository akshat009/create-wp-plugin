#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prompts from 'prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function slugify(text) {
	return text
		.toString()
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^\w\-]+/g, '')
		.replace(/\-\-+/g, '-');
}

function suggestNamespace(name) {
	if (!name) return 'MyPlugin';
	const words = name.trim().split(/[\s-_]+/);
	if (words.length === 1) {
		return words[0].charAt(0).toUpperCase() + words[0].slice(1);
	}
	// For names like "Orbit Widgets for Elementor" -> ORBW or OWFE
	const acronym = words.map(w => w.charAt(0).toUpperCase()).join('');
	return acronym.length >= 2 ? acronym : 'MyPlugin';
}

function suggestPrefix(namespace) {
	if (!namespace) return 'myplug';
	return namespace.toLowerCase();
}

async function main() {
	console.log('\n🚀 Welcome to create-wp-plugin scaffold generator!\n');

	const questions = [
		{
			type: 'text',
			name: 'name',
			message: '1. Plugin name:',
			initial: 'Orbit Widgets for Elementor',
			validate: value => (value.trim().length > 0 ? true : 'Plugin name is required.')
		},
		{
			type: 'text',
			name: 'slug',
			message: '2. Plugin slug:',
			initial: (prev, values) => slugify(values.name)
		},
		{
			type: 'text',
			name: 'namespace',
			message: '3. PHP namespace:',
			initial: (prev, values) => suggestNamespace(values.name)
		},
		{
			type: 'text',
			name: 'prefix',
			message: '4. Function/constant prefix:',
			initial: (prev, values) => suggestPrefix(values.namespace)
		},
		{
			type: 'text',
			name: 'authorName',
			message: '5. Author name:',
			initial: 'Akshat Saxena'
		},
		{
			type: 'text',
			name: 'authorEmail',
			message: '6. Author email:',
			initial: 'akshat@example.com'
		},
		{
			type: 'text',
			name: 'authorUri',
			message: '7. Author URI / GitHub URL:',
			initial: 'https://github.com/akshat009'
		},
		{
			type: 'text',
			name: 'description',
			message: '8. Description (one line):',
			initial: 'A powerful modern WordPress plugin scaffold.'
		},
		{
			type: 'text',
			name: 'minPhp',
			message: '9. Minimum PHP version:',
			initial: '8.0'
		},
		{
			type: 'confirm',
			name: 'useReact',
			message: '10. Use React / Gutenberg build?',
			initial: false
		},
		{
			type: 'multiselect',
			name: 'modules',
			message: '11. Modules to include (multi-select, space to toggle):',
			choices: [
				{ title: 'admin settings page', value: 'admin_settings' },
				{ title: 'shortcode', value: 'shortcode' },
				{ title: 'REST API', value: 'rest_api' },
				{ title: 'AJAX handler', value: 'ajax_handler' },
				{ title: 'CPT + taxonomy', value: 'cpt_taxonomy' },
				{ title: 'cron', value: 'cron' },
				{ title: 'Elementor widget base', value: 'elementor_widget' },
				{ title: 'WooCommerce hooks', value: 'woocommerce_hooks' }
			],
			hint: '- Space to select. Return to submit'
		},
		{
			type: 'text',
			name: 'outputDir',
			message: '12. Output directory:',
			initial: (prev, values) => `./${values.slug}`
		}
	];

	const answers = await prompts(questions, {
		onCancel: () => {
			console.log('\nOperation cancelled.');
			process.exit(1);
		}
	});

	const targetDir = path.resolve(process.cwd(), answers.outputDir);

	if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
		console.error(`\n❌ Error: Directory "${answers.outputDir}" already exists and is not empty.`);
		process.exit(1);
	}

	fs.mkdirSync(targetDir, { recursive: true });

	const replacements = {
		'{{PLUGIN_NAME}}': answers.name,
		'{{SLUG}}': answers.slug,
		'{{NS}}': answers.namespace,
		'{{NS_ESCAPED}}': answers.namespace.replace(/\\/g, '\\\\'),
		'{{PREFIX}}': answers.prefix.toLowerCase(),
		'{{PREFIX_UPPER}}': answers.prefix.toUpperCase(),
		'{{AUTHOR}}': answers.authorName,
		'{{AUTHOR_EMAIL}}': answers.authorEmail,
		'{{AUTHOR_URI}}': answers.authorUri,
		'{{DESCRIPTION}}': answers.description,
		'{{MIN_PHP}}': answers.minPhp,
		'{{YEAR}}': new Date().getFullYear().toString(),
		'{{AUTHOR_SLUG}}': answers.authorName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'author'
	};

	function processTemplateContent(content) {
		let result = content;
		for (const [key, val] of Object.entries(replacements)) {
			result = result.replaceAll(key, val);
		}
		return result;
	}

	function writeTemplateFile(srcPath, destRelativePath) {
		const raw = fs.readFileSync(srcPath, 'utf8');
		const processed = processTemplateContent(raw);
		const destPath = path.join(targetDir, destRelativePath);
		fs.mkdirSync(path.dirname(destPath), { recursive: true });
		fs.writeFileSync(destPath, processed, 'utf8');
	}

	const templatesDir = path.join(__dirname, 'templates');

	const filenameMappings = {
		'gitignore.tpl': '.gitignore',
		'editorconfig.tpl': '.editorconfig'
	};

	// Copy standard templates
	writeTemplateFile(path.join(templatesDir, 'plugin-main.php'), `${answers.slug}.php`);
	writeTemplateFile(path.join(templatesDir, 'composer.json'), 'composer.json');
	writeTemplateFile(path.join(templatesDir, 'phpcs.xml'), 'phpcs.xml');
	writeTemplateFile(path.join(templatesDir, 'src/CLI/Commands.php'), 'src/CLI/Commands.php');
	writeTemplateFile(path.join(templatesDir, 'tests/bootstrap.php'), 'tests/bootstrap.php');
	writeTemplateFile(path.join(templatesDir, 'phpunit.xml.dist'), 'phpunit.xml.dist');
	writeTemplateFile(path.join(templatesDir, 'tests/Unit/Example_Test.php'), 'tests/Unit/Example_Test.php');
	writeTemplateFile(path.join(templatesDir, 'gitignore.tpl'), filenameMappings['gitignore.tpl']);
	writeTemplateFile(path.join(templatesDir, 'editorconfig.tpl'), filenameMappings['editorconfig.tpl']);
	writeTemplateFile(path.join(templatesDir, 'uninstall.php'), 'uninstall.php');
	writeTemplateFile(path.join(templatesDir, 'assets/css/main.css'), 'assets/css/main.css');
	writeTemplateFile(path.join(templatesDir, 'assets/js/main.js'), 'assets/js/main.js');

	// Selected modules mapping
	const selectedModules = answers.modules || [];
	const moduleRegistrations = [];

	if (selectedModules.includes('admin_settings')) {
		writeTemplateFile(path.join(templatesDir, 'src/Admin/Settings_Page.php'), 'src/Admin/Settings_Page.php');
		moduleRegistrations.push('\t\t$this->services[\'admin_settings\'] = new Admin\\Settings_Page();');
	}
	if (selectedModules.includes('shortcode')) {
		writeTemplateFile(path.join(templatesDir, 'src/Frontend/Shortcode.php'), 'src/Frontend/Shortcode.php');
		moduleRegistrations.push('\t\t$this->services[\'shortcode\'] = new Frontend\\Shortcode();');
	}
	if (selectedModules.includes('rest_api')) {
		writeTemplateFile(path.join(templatesDir, 'src/Rest/Rest_Controller.php'), 'src/Rest/Rest_Controller.php');
		moduleRegistrations.push('\t\t$this->services[\'rest\'] = new Rest\\Rest_Controller();');
	}
	if (selectedModules.includes('ajax_handler')) {
		writeTemplateFile(path.join(templatesDir, 'src/Ajax/Ajax_Handler.php'), 'src/Ajax/Ajax_Handler.php');
		moduleRegistrations.push('\t\t$this->services[\'ajax\'] = new Ajax\\Ajax_Handler();');
	}
	if (selectedModules.includes('cpt_taxonomy')) {
		writeTemplateFile(path.join(templatesDir, 'src/PostTypes/Post_Types.php'), 'src/PostTypes/Post_Types.php');
		moduleRegistrations.push('\t\t$this->services[\'post_types\'] = new PostTypes\\Post_Types();');
	}
	if (selectedModules.includes('cron')) {
		writeTemplateFile(path.join(templatesDir, 'src/Cron/Scheduler.php'), 'src/Cron/Scheduler.php');
		moduleRegistrations.push('\t\t$this->services[\'cron\'] = new Cron\\Scheduler();');
	}
	if (selectedModules.includes('elementor_widget')) {
		writeTemplateFile(path.join(templatesDir, 'src/Widgets/Base_Widget.php'), 'src/Widgets/Base_Widget.php');
		moduleRegistrations.push('\t\t$this->services[\'elementor\'] = new Widgets\\Base_Widget();');
	}
	if (selectedModules.includes('woocommerce_hooks')) {
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Woo_Hooks.php'), 'src/Woo/Woo_Hooks.php');
		moduleRegistrations.push('\t\t$this->services[\'woo\'] = new Woo\\Woo_Hooks();');
	}

	// React setup
	let reactAssetsRegistration = '';
	let readmeReactInstall = '';
	let readmeReactScripts = '';
	let ciNodeJob = '';

	if (answers.useReact) {
		writeTemplateFile(path.join(templatesDir, 'react/package.json'), 'package.json');
		writeTemplateFile(path.join(templatesDir, 'react/assets/src/index.js'), 'assets/src/index.js');
		writeTemplateFile(path.join(templatesDir, 'src/Frontend/Assets.php'), 'src/Frontend/Assets.php');
		reactAssetsRegistration = '\t\t$this->services[\'assets\'] = new Frontend\\Assets();';
		readmeReactInstall = '3. Run `npm install` and `npm run build` to compile React assets.\n   > Note: `assets/build` is gitignored and generated during build.';
		readmeReactScripts = '- `npm run build` — Build React assets for production.\n- `npm run start` — Start React asset dev server in watch mode.';

		ciNodeJob = `
  node-build:
    name: Build React Assets
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Node Dependencies
        run: npm ci

      - name: Build Assets
        run: npm run build`;
	}

	// Process Plugin.php template with dynamic registrations
	let pluginContent = fs.readFileSync(path.join(templatesDir, 'src/Plugin.php'), 'utf8');
	pluginContent = pluginContent.replace('{{REACT_ASSETS_REGISTRATION}}', reactAssetsRegistration);
	pluginContent = pluginContent.replace('{{MODULE_REGISTRATIONS}}', moduleRegistrations.join('\n'));
	pluginContent = processTemplateContent(pluginContent);
	const pluginDestPath = path.join(targetDir, 'src/Plugin.php');
	fs.mkdirSync(path.dirname(pluginDestPath), { recursive: true });
	fs.writeFileSync(pluginDestPath, pluginContent, 'utf8');

	// Process ci.yml with dynamic node job
	let ciContent = fs.readFileSync(path.join(templatesDir, 'github/workflows/ci.yml'), 'utf8');
	ciContent = ciContent.replace('{{CI_NODE_JOB}}', ciNodeJob);
	ciContent = processTemplateContent(ciContent);
	const ciDestPath = path.join(targetDir, '.github/workflows/ci.yml');
	fs.mkdirSync(path.dirname(ciDestPath), { recursive: true });
	fs.writeFileSync(ciDestPath, ciContent, 'utf8');

	// Process README.md with dynamic React sections
	let readmeContent = fs.readFileSync(path.join(templatesDir, 'README.md'), 'utf8');
	readmeContent = readmeContent.replace('{{README_REACT_INSTALL}}', readmeReactInstall);
	readmeContent = readmeContent.replace('{{README_REACT_SCRIPTS}}', readmeReactScripts);
	readmeContent = processTemplateContent(readmeContent);
	const readmeDestPath = path.join(targetDir, 'README.md');
	fs.writeFileSync(readmeDestPath, readmeContent, 'utf8');

	console.log(`\n✅ Successfully scaffolded plugin "${answers.name}" in ${answers.outputDir}!\n`);
	console.log('Next steps:');
	console.log(`  cd ${answers.outputDir}`);
	console.log('  composer install');
	if (answers.useReact) {
		console.log('  npm install');
		console.log('  npm run build');
	}
	console.log('  git init\n');
}

main().catch(err => {
	console.error('An error occurred:', err);
	process.exit(1);
});
