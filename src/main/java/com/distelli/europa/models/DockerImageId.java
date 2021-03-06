/*
  $Id: $
  @file DockerImageId.java
  @brief Contains the DockerImageId.java class

  @author Rahul Singh [rsingh]
  Copyright (c) 2013, Distelli Inc., All Rights Reserved.
*/
package com.distelli.europa.models;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DockerImageId
{
    protected String tag;
    protected String sha; // manifest sha returned from registry.
}
