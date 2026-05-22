function switchView(viewId) {
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelectorAll('.deck-view').forEach(view => view.classList.remove('active'));

    document.getElementById(`nav-${viewId}`).classList.add('active');
    document.getElementById(`view-${viewId}`).classList.add('active');
}

window.switchView = switchView;
