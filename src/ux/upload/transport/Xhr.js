/**
 * @class Ext.ux.upload.DD
 * @extends Ext.ux.upload.Basic
 *
 * @author Sebastian Widelak (c) 2013
 */
Ext.define('Ext.ux.upload.transport.Xhr', {
    requires: ['Ext.ux.upload.transport.Abstract'],
    extend: 'Ext.ux.upload.transport.Abstract',
    initConnection: function () {
        var xhr = new XMLHttpRequest(),
            method = this.method,
            url = this.url;

        xhr.open(method, url, true);

        this.abortXhr = function () {
            xhr.abort();
        };

        return xhr;
    },
    uploadItem: function (item) {
        var me = this,
            file = item.get('file'),
            formData = new FormData(),
            xhr = this.initConnection(),
            json;

        Ext.Object.each(this.config.params, function (key, value) {
            formData.append(key, value);
        });
        Ext.Object.each(this.directParams, function (key, value) {
            formData.append(key, value);
        });
        formData.append(file.name, file);
        xhr.setRequestHeader(this.config.filenameHeader, file.name);
        xhr.setRequestHeader(this.config.sizeHeader, file.size);
        xhr.setRequestHeader(this.config.typeHeader, file.type);
        xhr.addEventListener('loadend', function (event) {

            var response = event.target;
            if (response.status != 200) {
                me.fireEvent('failure', event, item);
            } else {
                json = Ext.JSON.decode(response.responseText);
                if(json.success){
                    me.fireEvent('success', event, item);
                }else{
                    me.fireEvent('failure', event, item);
                }
            }
            return me.fireEvent('uploadend', response.status, event, item);
        }, true);
        xhr.upload.addEventListener("progress", function (event) {
            return me.fireEvent('progresschange', event, item);
        }, true);

        xhr.send(formData);
    },

    upload: function () {
        var me = this,
            idx =
                me.getFiles().findBy(function (r) {
                    if (r.get('status') === Ext.ux.upload.transport.Abstract.STATUS["pending"]) {
                        return true;
                    }
                });
        if (idx > -1) {
            me.uploadItem(me.getFiles().getAt(idx));
            me.on('uploadend', me.upload, me, {single: true});
        }
    },

    /**
     * Implements {@link Ext.ux.upload.uploader.AbstractUploader#abortUpload}
     */
    abortUpload: function () {
        this.abortXhr();
    },

    /**
     * @protected
     *
     * A placeholder for the abort procedure.
     */
    abortXhr: function () {
    }
});
