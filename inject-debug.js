// Automatically append ?gtm_debug=x in local environment
if ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') && !location.search.includes('gtm_debug=x')) {
    const newUrl = location.pathname + '?gtm_debug=x';
    location.replace(newUrl);
}
