package com.distelli.europa.handlers;

import com.distelli.europa.registry.RegistryError;
import com.distelli.europa.registry.RegistryErrorCode;
import com.distelli.europa.util.ObjectKeyFactory;
import com.distelli.europa.db.RegistryBlobDb;
import com.distelli.europa.models.RegistryBlob;
import org.eclipse.jetty.http.HttpMethod;
import com.distelli.webserver.RequestHandler;
import com.distelli.webserver.WebResponse;
import com.distelli.webserver.RequestContext;
import com.fasterxml.jackson.databind.JsonNode;
import javax.inject.Singleton;
import java.util.Map;
import java.util.HashMap;
import javax.inject.Inject;
import lombok.extern.log4j.Log4j;
import com.distelli.objectStore.ObjectStore;
import com.distelli.objectStore.ObjectPartKey;

@Log4j
@Singleton
public class RegistryLayerUploadBegin extends RegistryBase {
    @Inject
    private ObjectStore _objectStore;
    @Inject
    private ObjectKeyFactory _objectKeyFactory;
    @Inject
    private RegistryBlobDb _blobDb;

    public WebResponse handleRegistryRequest(RequestContext requestContext) {
        String digest = requestContext.getMatchedRoute().getParam("digest");
        if ( null == digest ) return handleMultipartInit(requestContext);
        return handleMonolithicUpload(requestContext);
    }

    private WebResponse handleMonolithicUpload(RequestContext requestContext) {
        // TODO: support this API too...
        throw new UnsupportedOperationException();
    }

    private WebResponse handleMultipartInit(RequestContext requestContext) {
        String owner = requestContext.getMatchedRoute().getParam("owner");
        if ( null != owner && null == getDomainForOwner(owner) ) {
            throw new RegistryError("Unknown username="+owner,
                                    RegistryErrorCode.NAME_UNKNOWN);
        }
        String name = requestContext.getMatchedRoute().getParam("name");
        RegistryBlob blob = null;
        ObjectPartKey partKey = null;
        
        boolean success = false;
        try {
            blob = _blobDb.newRegistryBlob(requestContext.getRemoteUser());            
            partKey = _objectStore.newMultipartPut(_objectKeyFactory.forRegistryBlobId(blob.getBlobId()));
            _blobDb.setUploadId(blob.getBlobId(), partKey.getUploadId());
            success = true;
        } finally {
            // Try to cleanup on failure...
            if ( ! success ) {
                if ( null != blob ) _blobDb.forgetBlob(blob.getBlobId());
                if ( null != partKey ) _objectStore.abortPut(partKey);
            }
        }

        String location = joinWithSlash("/v2", owner, name, "blobs", "uploads", blob.getBlobId());
        WebResponse response = new WebResponse(202);
        response.setContentType("text/plain");
        response.setResponseHeader("Location", location);
        response.setResponseHeader("Docker-Upload-UUID", blob.getBlobId());
        return response;
    }
}
