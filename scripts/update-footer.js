// Update Footer Script
// This script will update all HTML files in the project with the enhanced footer

const fs = require('fs');
const path = require('path');

// Define the enhanced footer
const enhancedFooter = `    <footer>
        <div class="footer-container">
            <div class="footer-column">
                <h3>VroomGo</h3>
                <p>Your trusted platform for vehicle rentals. We make it easy to find and book the perfect ride for any occasion.</p>
                <div class="footer-social">
                    <a href="#"><i class="fab fa-facebook-f"></i></a>
                    <a href="#"><i class="fab fa-twitter"></i></a>
                    <a href="#"><i class="fab fa-instagram"></i></a>
                    <a href="#"><i class="fab fa-linkedin-in"></i></a>
                </div>
            </div>
            
            <div class="footer-column">
                <h3>Quick Links</h3>
                <ul class="footer-links">
                    <li><a href="HOMEPAGE_PATH">Home</a></li>
                    <li><a href="PAGES_PATH/dashboard.html">Dashboard</a></li>
                    <li><a href="PAGES_PATH/about.html">About Us</a></li>
                    <li><a href="PAGES_PATH/contact.html">Contact Us</a></li>
                </ul>
            </div>
            
            <div class="footer-column">
                <h3>Vehicle Types</h3>
                <ul class="footer-links">
                    <li><a href="HOMEPAGE_PATH?type=Car">Cars</a></li>
                    <li><a href="HOMEPAGE_PATH?type=SUV">SUVs</a></li>
                    <li><a href="HOMEPAGE_PATH?type=Bike">Motorcycles</a></li>
                    <li><a href="HOMEPAGE_PATH?type=Luxury">Luxury Vehicles</a></li>
                </ul>
            </div>
            
            <div class="footer-column footer-contact">
                <h3>Contact Us</h3>
                <p><i class="fas fa-map-marker-alt"></i> Ahmedabad, Gujarat</p>
                <p><i class="fas fa-phone-alt"></i>+91 1234567890</p>
                <p><i class="fas fa-envelope"></i> info@vroomgo.com</p>
                <p><i class="fas fa-clock"></i> Mon-Fri: 9am-6pm, Sat: 10am-4pm</p>
            </div>
        </div>
        
        <div class="footer-bottom">
            <p>&copy; 2025 VroomGo. All rights reserved. <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
        </div>
    </footer>`;

// Function to update the footer in an HTML file
function updateFooter(filePath, isInPagesDir) {
    const homepagePath = isInPagesDir ? '../index.html' : 'index.html';
    const pagesPath = isInPagesDir ? '' : 'pages';
    
    let footer = enhancedFooter
        .replace(/HOMEPAGE_PATH/g, homepagePath)
        .replace(/PAGES_PATH/g, pagesPath);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace the old footer with the new one
        content = content.replace(/<footer>[\s\S]*?<\/footer>/g, footer);
        
        // Add footer.css link if it doesn't exist
        if (!content.includes('footer.css')) {
            const cssImport = isInPagesDir
                ? '<link rel="stylesheet" href="../css/footer.css">'
                : '<link rel="stylesheet" href="css/footer.css">';
            
            // Insert after other CSS imports
            content = content.replace(
                /(<link[^>]*?\.css[^>]*?>)/g, 
                (match, p1, offset, string) => {
                    // Check if this is the last CSS import
                    const nextLink = string.substring(offset + p1.length).match(/<link[^>]*?\.css[^>]*?>/);
                    if (!nextLink) {
                        return p1 + '\n    ' + cssImport;
                    }
                    return p1;
                }
            );
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated footer in ${filePath}`);
    } catch (error) {
        console.error(`Error updating ${filePath}: ${error.message}`);
    }
}

// Process all HTML files in the project
function processDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
            // Skip node_modules and .git directories
            if (item !== 'node_modules' && item !== '.git') {
                processDirectory(itemPath);
            }
        } else if (item.endsWith('.html')) {
            const isInPagesDir = dirPath.includes('pages');
            updateFooter(itemPath, isInPagesDir);
        }
    }
}

// Start processing from the project root
const projectRoot = '.';
processDirectory(projectRoot);

console.log('Footer update completed!');
