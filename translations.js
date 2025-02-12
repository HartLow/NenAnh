const translations = {
    vi: {
        title: "Trình Nén Ảnh Online",
        description: "Nén không giới hạn ảnh với chất lượng ảnh tối ưu",
        dropText: "Kéo & Thả Ảnh Vào Đây",
        orText: "hoặc",
        selectImages: "Chọn Ảnh",
        defaultQuality: "Chất Lượng Mặc Định",
        highQuality: "Chất Lượng Cao",
        balanced: "Cân Bằng",
        smallSize: "Dung Lượng Nhỏ",
        qualityLabel: "Chất lượng (1-100)",
        previewSection: "Xem Trước",
        clearHistory: "Xóa",
        compress: "Nén Ảnh",
        compressing: "Đang nén...",
        downloadAll: "Tải Xuống Tất Cả",
        originalSize: "Kích thước gốc",
        compressedSize: "Kích thước sau nén",
        reduced: "Đã giảm",
        quality: "Chất lượng",
        preview: "Xem trước",
        error: "Có lỗi xảy ra khi nén ảnh. Vui lòng thử lại."
    },
    en: {
        title: "Online Image Compressor",
        description: "Compress unlimited images with optimal quality",
        dropText: "Drop Images Here",
        orText: "or",
        selectImages: "Select Images",
        defaultQuality: "Default Quality",
        highQuality: "High Quality",
        balanced: "Balanced",
        smallSize: "Small Size",
        qualityLabel: "Quality (1-100)",
        previewSection: "Preview",
        clearHistory: "Clear",
        compress: "Compress",
        compressing: "Compressing...",
        downloadAll: "Download All",
        originalSize: "Original size",
        compressedSize: "Compressed size",
        reduced: "Reduced",
        quality: "Quality",
        preview: "Preview",
        error: "Error compressing images. Please try again."
    }
};

// Add language utility functions
const langUtil = {
    // Get current language
    getCurrentLang() {
        return localStorage.getItem('language') || 'vi';
    },

    // Get translation for a key
    getText(key) {
        const currentLang = this.getCurrentLang();
        return translations[currentLang][key] || key;
    },

    // Update all translatable elements
    updateTexts() {
        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            element.textContent = this.getText(key);
        });
    }
};
