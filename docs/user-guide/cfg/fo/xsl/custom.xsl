<?xml version="1.0" encoding="UTF-8"?>
<!--
  DitaCraft User Guide — PDF XSL template overrides.
  Adds alternating table row colors and other rendering improvements.
-->
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:fo="http://www.w3.org/1999/XSL/Format"
                version="3.0">

  <!-- Alternating row colors for table body rows -->
  <xsl:template name="generateTableRowColor">
    <xsl:variable name="rowpos" select="count(preceding-sibling::*[contains(@class, ' topic/row ')]) + 1"/>
    <xsl:if test="$rowpos mod 2 = 0">
      <xsl:attribute name="background-color">#f8fafc</xsl:attribute>
    </xsl:if>
  </xsl:template>

  <!-- Page number in body footers -->
  <xsl:template name="insertBodyOddFooter">
    <fo:static-content flow-name="odd-body-footer">
      <fo:block xsl:use-attribute-sets="__body__odd__footer">
        <fo:page-number/>
      </fo:block>
    </fo:static-content>
  </xsl:template>

  <xsl:template name="insertBodyEvenFooter">
    <fo:static-content flow-name="even-body-footer">
      <fo:block xsl:use-attribute-sets="__body__even__footer">
        <fo:page-number/>
      </fo:block>
    </fo:static-content>
  </xsl:template>

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
