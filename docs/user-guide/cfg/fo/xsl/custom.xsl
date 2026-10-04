<?xml version="1.0" encoding="UTF-8"?>
<!--
  DITA Craft User Guide — PDF XSL template overrides.
  Adds alternating table row colors and other rendering improvements.
-->
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:fo="http://www.w3.org/1999/XSL/Format"
                xmlns:fox="http://xmlgraphics.apache.org/fop/extensions"
                xmlns:xs="http://www.w3.org/2001/XMLSchema"
                exclude-result-prefixes="xs"
                version="3.0">

  <!--
    Front cover (the PDF's first page): the cover image (front_page_picture.png, next to the
    bookmap; made by scripts/cover/render.js at the page's proportions) edge to edge, and the
    version and month from the bookmap (bookmeta vrm, critdates revised/@modified) printed in the
    image's empty band above its footer. Replaces the title and subtitle DITA-OT writes there; the
    image holds the name. (The cover topic is print="no": it is the HTML5 output's cover only.)
  -->
  <xsl:template name="createFrontCoverContents">
    <xsl:variable name="dir" select="if (ends-with($input.dir.url, '/')) then $input.dir.url else concat($input.dir.url, '/')"/>
    <!-- vrm and revised are base elements (topic/vrm, topic/revised) inside bookmap/bookmeta -->
    <xsl:variable name="bookmeta" select="($map//*[contains(@class, ' bookmap/bookmeta ')])[1]"/>
    <xsl:variable name="vrm" select="($bookmeta//*[contains(@class, ' topic/vrm ')])[last()]"/>
    <xsl:variable name="modified" select="string(($bookmeta//*[contains(@class, ' topic/revised ')])[last()]/@modified)"/>
    <fo:block-container absolute-position="fixed" top="0mm" left="0mm"
                        width="{$page-width}" height="{$page-height}" background-color="#070B16">
      <fo:block font-size="0pt" line-height="0pt">
        <fo:external-graphic src="url('{$dir}front_page_picture.png')"
                             content-width="{$page-width}" content-height="{$page-height}" scaling="uniform"
                             fox:alt-text="DITA Craft User Guide: the DITA Craft name and logo, and the words The easiest way to edit and publish your DITA files"/>
      </fo:block>
    </fo:block-container>
    <fo:block-container absolute-position="fixed" top="256mm" left="0mm" width="{$page-width}">
      <fo:block/>
      <xsl:if test="$vrm">
        <fo:block text-align="center" font-family="Sans" font-size="13pt"
                  font-weight="bold" color="#F4F6FB">
          <xsl:value-of select="concat('Version ', string-join(($vrm/@version, $vrm/@release, $vrm/@modification)[normalize-space()], '.'))"/>
        </fo:block>
      </xsl:if>
      <xsl:if test="$modified">
        <fo:block text-align="center" font-family="Sans" font-size="10pt"
                  color="#C5CEDF" space-before="2pt">
          <xsl:value-of select="if ($modified castable as xs:date)
                                then format-date(xs:date($modified), '[MNn] [Y]', 'en', (), ())
                                else $modified"/>
        </fo:block>
      </xsl:if>
    </fo:block-container>
    <fo:block/>
  </xsl:template>

  <!-- Alternating row colors for table body rows -->
  <xsl:template name="generateTableRowColor">
    <xsl:variable name="rowpos" select="count(preceding-sibling::*[contains(@class, ' topic/row ')]) + 1"/>
    <xsl:if test="$rowpos mod 2 = 0">
      <xsl:attribute name="background-color">#f8fafc</xsl:attribute>
    </xsl:if>
  </xsl:template>

  <!-- Page numbers: DITA-OT's body headers print them (no footer number: it was a second one). -->

  <!-- Suppress duplicate title rendered by PDF2 chapter heading for preface/notices wrappers -->
  <xsl:template priority="10"
      match="*[contains(@class,' topic/title ')]
              [parent::*[contains(@class,' topic/topic ')]]
              [ancestor::*[contains(@class,' bookmap/preface ')]]"/>

  <xsl:template priority="10"
      match="*[contains(@class,' topic/title ')]
              [parent::*[contains(@class,' topic/topic ')]]
              [ancestor::*[contains(@class,' bookmap/notices ')]]"/>

</xsl:stylesheet>
