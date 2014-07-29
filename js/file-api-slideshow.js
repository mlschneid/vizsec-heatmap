window.addEvent('domready', function() {
    var holder = document.getElementById('holder'),
        state = document.getElementById('status');

    var map = document.getElementById('map');
    var mapLoaded = false;

    if (typeof window.FileReader === 'undefined') {
        state.className = 'fail';
    } else {
        state.className = 'success';
        state.innerHTML = 'Drag and drop map!';
    }

    holder.ondragover = function () {
        this.className = 'hover';
        return false;
    };
    holder.ondragend = function () {
        this.className = '';
        return false;
    };
    holder.ondrop = function (e) {
        this.className = '';
        e.preventDefault();

        var reader = new FileReader();
        var files = e.dataTransfer.files;
        for(var i = 0; files.length; i++) {
            var file = files[i]; 
            reader.readAsText(file);
            reader.onload = function (event) {
                if (mapLoaded == false) { //load map
                    svgfile = event.target.result;
                    tempWidth = $(svgfile)[6].viewBox.baseVal.width;
                    tempHeight = $(svgfile)[6].viewBox.baseVal.height;
                    map.style.width = tempWidth;
                    map.style.height = tempHeight;
                    display_map(file.name, tempWidth, tempHeight);
                    add_heatmap();
                    mapLoaded = true;
                    state.innerHTML = 'And now your heatmaps!';
                }
                else { //load heatmap
                    csvfile = event.target.result;
                    //csvfile = event.target.result;
                    csvArray = $.csv.toArrays(csvfile);
                    for
                    populate_heatmap(csvArray, minHeatValue, maxHeatValue);
                    save_heatmap('jpeg', csvfile);
                }

            };

        }
        return false;
    };
});
