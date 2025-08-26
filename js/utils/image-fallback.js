console.log("Image fallback script loaded");
document.addEventListener('DOMContentLoaded', function() {
    // Check for broken images and replace with a data URI placeholder
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            console.log("Image failed to load:", this.src);
            // Replace with a colored rectangle as placeholder
            this.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22300%22 height%3D%22200%22%3E%3Crect width%3D%22300%22 height%3D%22200%22 fill%3D%22%23cccccc%22%3E%3C%2Frect%3E%3Ctext x%3D%22150%22 y%3D%22100%22 font-size%3D%2220%22 text-anchor%3D%22middle%22 alignment-baseline%3D%22middle%22 fill%3D%22%23333333%22%3ENo Image%3C%2Ftext%3E%3C%2Fsvg%3E';
            this.style.objectFit = 'cover';
            this.style.width = '100%';
            this.style.height = '100%';
            console.log("Placeholder image applied");
        });
    });
});
