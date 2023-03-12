const H5P = require('@lumieducation/h5p-server')
const h5pAjaxExpressRouter = require('@lumieducation/h5p-express').h5pAjaxExpressRouter
const libraryAdministrationExpressRouter = require('@lumieducation/h5p-express').libraryAdministrationExpressRouter
const contentTypeCacheExpressRouter = require('@lumieducation/h5p-express').contentTypeCacheExpressRouter
const path = require('path')
const fileUpload = require('express-fileupload')
const DefaultUser = require('../DefaultUser.js')
const expressRoutes = require('../routes/h5pRoutes.js')
const createH5PEditor = require('../h5p/createH5PEditor.js')
const h5pRoutes = require('../routes/h5pRoutes.js')
const contentCreateView = require('../../views/contentCreate.js')

module.exports = async (server) => {
    // Load the configuration file from the local file system
    const config = await new H5P.H5PConfig(
        new H5P.fsImplementations.JsonStorage(
            path.join(__dirname, '../../config.json')
        )
    ).load();

    const h5pEditor = await createH5PEditor(
        config,
        path.join(__dirname, '../../h5p/libraries'), // the path on the local disc where
        // libraries should be stored)
        path.join(__dirname, '../../h5p/content'), // the path on the local disc where content
        // is stored. Only used / necessary if you use the local filesystem
        // content storage class.
        path.join(__dirname, '../../h5p/temporary-storage'), // the path on the local disc
        // where temporary files (uploads) should be stored. Only used /
        // necessary if you use the local filesystem temporary storage class.,
        path.join(__dirname, '../../h5p/user-data')
    )

    // The H5PPlayer object is used to display H5P content.
    const h5pPlayer = new H5P.H5PPlayer(
        h5pEditor.libraryStorage,
        h5pEditor.contentStorage,
        config,
        undefined,
        undefined,
        undefined,
        undefined,
        h5pEditor.contentUserDataStorage
    );

    // Configure file uploads
    server.use(fileUpload({ limits: { fileSize: h5pEditor.config.maxTotalSize }}));

    // It is important that you inject a user object into the request object!
    // The Express adapter below (H5P.adapters.express) expects the user
    // object to be present in requests.
    // In your real implementation you would create the object using sessions,
    // JSON webtokens or some other means.
    server.use((req, res, next) => {
        req.user = new DefaultUser();
        next();
    });

    server.use(
        h5pEditor.config.baseUrl,
        h5pRoutes(
            h5pEditor,
            h5pPlayer,
            'auto' // You can change the language of the editor by setting
            // the language code you need here. 'auto' means the route will try
            // to use the language detected by the i18next language detector.
        )
    );

    // The Express adapter handles GET and POST requests to various H5P
    // endpoints. You can add an options object as a last parameter to configure
    // which endpoints you want to use. In this case we don't pass an options
    // object, which means we get all of them.
    server.use(
        h5pEditor.config.baseUrl,
        h5pAjaxExpressRouter(
            h5pEditor,
            path.resolve(path.join(__dirname, '../../h5p/core')), // the path on the local disc where the
            // files of the JavaScript client of the player are stored
            path.resolve(path.join(__dirname, '../../h5p/editor')), // the path on the local disc where the
            // files of the JavaScript client of the editor are stored
            undefined,
            'en' // You can change the language of the editor here by setting
            // the language code you need here. 'auto' means the route will try
            // to use the language detected by the i18next language detector.
        )
    );

    h5pEditor.setRenderer(contentCreateView)

    // The expressRoutes are routes that create pages for these actions:
    // - Creating new content
    // - Editing content
    // - Saving content
    // - Deleting content
    server.use(
        h5pEditor.config.baseUrl,
        expressRoutes(
            h5pEditor,
            h5pPlayer,
            'en' // You can change the language of the editor by setting
            // the language code you need here. 'auto' means the route will try
            // to use the language detected by the i18next language detector.
        )
    );

    // The LibraryAdministrationExpress routes are REST endpoints that offer
    // library management functionality.
    server.use(
        `${h5pEditor.config.baseUrl}/libraries`,
        libraryAdministrationExpressRouter(h5pEditor)
    );

    // The ContentTypeCacheExpress routes are REST endpoints that allow updating
    // the content type cache manually.
    server.use(
        `${h5pEditor.config.baseUrl}/content-type-cache`,
        contentTypeCacheExpressRouter(h5pEditor.contentTypeCache)
    );

    

}