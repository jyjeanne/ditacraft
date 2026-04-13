<?xml version="1.0" encoding="UTF-8"?>
<!--
  DitaCraft User Guide — PDF readability customization.
  Overrides DITA-OT default attribute sets for improved typography,
  spacing, and visual hierarchy.
-->
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:fo="http://www.w3.org/1999/XSL/Format"
                version="3.0">

  <!-- ============================================================= -->
  <!--  PAGE LAYOUT                                                  -->
  <!-- ============================================================= -->

  <!-- A4 page for international readability -->
  <xsl:variable name="page-width">210mm</xsl:variable>
  <xsl:variable name="page-height">297mm</xsl:variable>

  <!-- Generous margins for comfortable reading -->
  <xsl:variable name="page-margin-top">25mm</xsl:variable>
  <xsl:variable name="page-margin-bottom">25mm</xsl:variable>
  <xsl:variable name="page-margin-inside">25mm</xsl:variable>
  <xsl:variable name="page-margin-outside">20mm</xsl:variable>

  <!-- Reduce side column indent for more text width -->
  <xsl:variable name="side-col-width">18pt</xsl:variable>

  <!-- ============================================================= -->
  <!--  TYPOGRAPHY — Base font                                       -->
  <!-- ============================================================= -->

  <!-- Larger base font for readability (default is 10pt/12pt) -->
  <xsl:variable name="default-font-size">11pt</xsl:variable>
  <xsl:variable name="default-line-height">15pt</xsl:variable>

  <!-- Root font: use sans-serif for modern, clean look -->
  <xsl:attribute-set name="__fo__root">
    <xsl:attribute name="font-family">Helvetica, Arial, sans-serif</xsl:attribute>
    <xsl:attribute name="font-size"><xsl:value-of select="$default-font-size"/></xsl:attribute>
    <xsl:attribute name="xml:lang" select="translate($locale, '_', '-')"/>
    <xsl:attribute name="writing-mode" select="$writing-mode"/>
  </xsl:attribute-set>

  <!-- ============================================================= -->
  <!--  TITLES                                                       -->
  <!-- ============================================================= -->

  <!-- Common title: sans-serif, primary blue -->
  <xsl:attribute-set name="common.title">
    <xsl:attribute name="font-family">Helvetica, Arial, sans-serif</xsl:attribute>
    <xsl:attribute name="color">#1e3a5f</xsl:attribute>
  </xsl:attribute-set>

  <!-- Topic title (h1 equivalent) -->
  <xsl:attribute-set name="topic.title" use-attribute-sets="common.title common.border__bottom">
    <xsl:attribute name="font-size">22pt</xsl:attribute>
    <xsl:attribute name="font-weight">bold</xsl:attribute>
    <xsl:attribute name="space-before">0pt</xsl:attribute>
    <xsl:attribute name="space-after">14pt</xsl:attribute>
    <xsl:attribute name="padding-top">14pt</xsl:attribute>
    <xsl:attribute name="border-after-width">2pt</xsl:attribute>
    <xsl:attribute name="border-after-color">#2563eb</xsl:attribute>
    <xsl:attribute name="keep-with-next.within-column">always</xsl:attribute>
  </xsl:attribute-set>

  <!-- Section title (h2 equivalent) -->
  <xsl:attribute-set name="section.title" use-attribute-sets="common.title">
    <xsl:attribute name="font-size">16pt</xsl:attribute>
    <xsl:attribute name="font-weight">bold</xsl:attribute>
    <xsl:attribute name="space-before">18pt</xsl:attribute>
    <xsl:attribute name="space-after">8pt</xsl:attribute>
    <xsl:attribute name="keep-with-next.within-column">always</xsl:attribute>
  </xsl:attribute-set>

  <!-- Nested topic title (h3 equivalent) -->
  <xsl:attribute-set name="topic.topic.title" use-attribute-sets="common.title common.border__bottom">
    <xsl:attribute name="font-size">18pt</xsl:attribute>
    <xsl:attribute name="font-weight">bold</xsl:attribute>
    <xsl:attribute name="space-before">20pt</xsl:attribute>
    <xsl:attribute name="space-after">10pt</xsl:attribute>
    <xsl:attribute name="border-after-width">0.5pt</xsl:attribute>
    <xsl:attribute name="border-after-color">#cbd5e1</xsl:attribute>
    <xsl:attribute name="padding-top">0pt</xsl:attribute>
    <xsl:attribute name="keep-with-next.within-column">always</xsl:attribute>
  </xsl:attribute-set>

  <!-- Level 3 topic title -->
  <xsl:attribute-set name="topic.topic.topic.title" use-attribute-sets="common.title">
    <xsl:attribute name="font-size">14pt</xsl:attribute>
    <xsl:attribute name="font-weight">bold</xsl:attribute>
    <xsl:attribute name="space-before">14pt</xsl:attribute>
    <xsl:attribute name="space-after">6pt</xsl:attribute>
    <xsl:attribute name="keep-with-next.within-column">always</xsl:attribute>
  </xsl:attribute-set>

  <!-- ============================================================= -->
  <!--  BODY TEXT                                                     -->
  <!-- ============================================================= -->

  <!-- Paragraphs: comfortable spacing -->
  <xsl:attribute-set name="common.block">
    <xsl:attribute name="space-before">6pt</xsl:attribute>
    <xsl:attribute name="space-after">6pt</xsl:attribute>
    <xsl:attribute name="line-height"><xsl:value-of select="$default-line-height"/></xsl:attribute>
  </xsl:attribute-set>

  <!-- Short description: slightly italic, secondary color -->
  <xsl:attribute-set name="topic__shortdesc" use-attribute-sets="common.block">
    <xsl:attribute name="font-style">italic</xsl:attribute>
    <xsl:attribute name="color">#475569</xsl:attribute>
    <xsl:attribute name="space-after">12pt</xsl:attribute>
  </xsl:attribute-set>

  <!-- Links: blue, no underline by default -->
  <xsl:attribute-set name="common.link">
    <xsl:attribute name="color">#2563eb</xsl:attribute>
    <xsl:attribute name="font-style">normal</xsl:attribute>
  </xsl:attribute-set>

  <!-- ============================================================= -->
  <!--  CODE BLOCKS                                                  -->
  <!-- ============================================================= -->

  <!-- Inline code -->
  <xsl:attribute-set name="codeph">
    <xsl:attribute name="font-family">Courier, monospace</xsl:attribute>
    <xsl:attribute name="font-size">0.9em</xsl:attribute>
    <xsl:attribute name="background-color">#f1f5f9</xsl:attribute>
    <xsl:attribute name="padding-start">2pt</xsl:attribute>
    <xsl:attribute name="padding-end">2pt</xsl:attribute>
    <xsl:attribute name="color">#be185d</xsl:attribute>
  </xsl:attribute-set>

  <!-- Code blocks: dark background, generous padding -->
  <xsl:attribute-set name="codeblock" use-attribute-sets="common.block">
    <xsl:attribute name="font-family">Courier, monospace</xsl:attribute>
    <xsl:attribute name="font-size">9pt</xsl:attribute>
    <xsl:attribute name="line-height">13pt</xsl:attribute>
    <xsl:attribute name="background-color">#1e293b</xsl:attribute>
    <xsl:attribute name="color">#e2e8f0</xsl:attribute>
    <xsl:attribute name="padding-start">10pt</xsl:attribute>
    <xsl:attribute name="padding-end">10pt</xsl:attribute>
    <xsl:attribute name="padding-top">10pt</xsl:attribute>
    <xsl:attribute name="padding-bottom">10pt</xsl:attribute>
    <xsl:attribute name="start-indent">6pt + from-parent(start-indent)</xsl:attribute>
    <xsl:attribute name="end-indent">6pt + from-parent(end-indent)</xsl:attribute>
    <xsl:attribute name="wrap-option">wrap</xsl:attribute>
    <xsl:attribute name="white-space-collapse">false</xsl:attribute>
    <xsl:attribute name="linefeed-treatment">preserve</xsl:attribute>
    <xsl:attribute name="white-space-treatment">preserve</xsl:attribute>
    <xsl:attribute name="keep-with-previous.within-page">always</xsl:attribute>
    <xsl:attribute name="space-before">10pt</xsl:attribute>
    <xsl:attribute name="space-after">10pt</xsl:attribute>
    <xsl:attribute name="border-style">solid</xsl:attribute>
    <xsl:attribute name="border-width">0.5pt</xsl:attribute>
    <xsl:attribute name="border-color">#334155</xsl:attribute>
  </xsl:attribute-set>

  <!-- Pre: same treatment as codeblock but lighter background -->
  <xsl:attribute-set name="pre" use-attribute-sets="common.block">
    <xsl:attribute name="font-family">Courier, monospace</xsl:attribute>
    <xsl:attribute name="font-size">9pt</xsl:attribute>
    <xsl:attribute name="line-height">13pt</xsl:attribute>
    <xsl:attribute name="background-color">#f1f5f9</xsl:attribute>
    <xsl:attribute name="padding">8pt</xsl:attribute>
    <xsl:attribute name="start-indent">6pt + from-parent(start-indent)</xsl:attribute>
    <xsl:attribute name="end-indent">6pt + from-parent(end-indent)</xsl:attribute>
    <xsl:attribute name="wrap-option">wrap</xsl:attribute>
    <xsl:attribute name="white-space-collapse">false</xsl:attribute>
    <xsl:attribute name="linefeed-treatment">preserve</xsl:attribute>
    <xsl:attribute name="white-space-treatment">preserve</xsl:attribute>
  </xsl:attribute-set>

  <!-- ============================================================= -->
  <!--  TABLES                                                       -->
  <!-- ============================================================= -->

  <!-- Table header cells: blue background, white text -->
  <xsl:attribute-set name="thead.row.entry">
    <xsl:attribute name="background-color">#e0f2fe</xsl:attribute>
    <xsl:attribute name="color">#1e3a5f</xsl:attribute>
    <xsl:attribute name="font-weight">bold</xsl:attribute>
    <xsl:attribute name="padding">8pt</xsl:attribute>
    <xsl:attribute name="border-style">solid</xsl:attribute>
    <xsl:attribute name="border-width">1.5pt</xsl:attribute>
    <xsl:attribute name="border-color">#2563eb</xsl:attribute>
  </xsl:attribute-set>

  <!-- Table body cells: proper padding, subtle striping -->
  <xsl:attribute-set name="tbody.row.entry">
    <xsl:attribute name="padding">6pt</xsl:attribute>
    <xsl:attribute name="border-style">solid</xsl:attribute>
    <xsl:attribute name="border-width">0.5pt</xsl:attribute>
    <xsl:attribute name="border-color">#e2e8f0</xsl:attribute>
  </xsl:attribute-set>

  <!-- Alternating row colors handled via XSL template (see custom.xsl) -->
  <xsl:attribute-set name="table" use-attribute-sets="base-font">
    <xsl:attribute name="space-after">14pt</xsl:attribute>
    <xsl:attribute name="start-indent">0pt</xsl:attribute>
    <xsl:attribute name="font-size">10pt</xsl:attribute>
    <xsl:attribute name="border-style">solid</xsl:attribute>
    <xsl:attribute name="border-width">0.5pt</xsl:attribute>
    <xsl:attribute name="border-color">#e2e8f0</xsl:attribute>
  </xsl:attribute-set>

  <!-- Simple table styling -->
  <xsl:attribute-set name="sthead.stentry">
    <xsl:attribute name="background-color">#2563eb</xsl:attribute>
    <xsl:attribute name="color">#ffffff</xsl:attribute>
    <xsl:attribute name="font-weight">bold</xsl:attribute>
    <xsl:attribute name="padding">5pt</xsl:attribute>
  </xsl:attribute-set>

  <xsl:attribute-set name="strow.stentry">
    <xsl:attribute name="padding">5pt</xsl:attribute>
  </xsl:attribute-set>

  <!-- ============================================================= -->
  <!--  NOTES / CALLOUTS                                             -->
  <!-- ============================================================= -->

  <!-- Note container: add left border + background -->
  <xsl:attribute-set name="note__table" use-attribute-sets="common.block">
    <xsl:attribute name="background-color">#eff6ff</xsl:attribute>
    <xsl:attribute name="border-start-style">solid</xsl:attribute>
    <xsl:attribute name="border-start-width">3pt</xsl:attribute>
    <xsl:attribute name="border-start-color">#2563eb</xsl:attribute>
    <xsl:attribute name="padding">8pt</xsl:attribute>
    <xsl:attribute name="space-before">10pt</xsl:attribute>
    <xsl:attribute name="space-after">10pt</xsl:attribute>
  </xsl:attribute-set>

  <!-- ============================================================= -->
  <!--  LISTS                                                        -->
  <!-- ============================================================= -->

  <!-- Unordered list items: more vertical space -->
  <xsl:attribute-set name="ul.li">
    <xsl:attribute name="space-after">3pt</xsl:attribute>
    <xsl:attribute name="space-before">3pt</xsl:attribute>
  </xsl:attribute-set>

  <!-- Ordered list items -->
  <xsl:attribute-set name="ol.li">
    <xsl:attribute name="space-after">3pt</xsl:attribute>
    <xsl:attribute name="space-before">3pt</xsl:attribute>
  </xsl:attribute-set>

  <!-- Definition list: term styling -->
  <xsl:attribute-set name="dlentry.dt">
    <xsl:attribute name="font-weight">bold</xsl:attribute>
    <xsl:attribute name="space-before">8pt</xsl:attribute>
    <xsl:attribute name="keep-with-next.within-page">always</xsl:attribute>
  </xsl:attribute-set>

  <xsl:attribute-set name="dlentry.dd">
    <xsl:attribute name="start-indent">from-parent(start-indent) + 15pt</xsl:attribute>
  </xsl:attribute-set>

  <!-- ============================================================= -->
  <!--  FRONT MATTER                                                 -->
  <!-- ============================================================= -->

  <!-- Cover title: large, centered -->
  <xsl:attribute-set name="__frontmatter__title" use-attribute-sets="common.title">
    <xsl:attribute name="font-size">30pt</xsl:attribute>
    <xsl:attribute name="font-weight">bold</xsl:attribute>
    <xsl:attribute name="color">#1e3a5f</xsl:attribute>
    <xsl:attribute name="text-align">center</xsl:attribute>
    <xsl:attribute name="space-before">80mm</xsl:attribute>
    <xsl:attribute name="line-height">36pt</xsl:attribute>
  </xsl:attribute-set>

  <xsl:attribute-set name="__frontmatter__subtitle" use-attribute-sets="common.title">
    <xsl:attribute name="font-size">16pt</xsl:attribute>
    <xsl:attribute name="font-weight">normal</xsl:attribute>
    <xsl:attribute name="font-style">italic</xsl:attribute>
    <xsl:attribute name="color">#475569</xsl:attribute>
    <xsl:attribute name="text-align">center</xsl:attribute>
    <xsl:attribute name="space-before">12pt</xsl:attribute>
  </xsl:attribute-set>

  <!-- ============================================================= -->
  <!--  TABLE OF CONTENTS                                            -->
  <!-- ============================================================= -->

  <!-- TOC title -->
  <xsl:attribute-set name="__toc__header" use-attribute-sets="common.title">
    <xsl:attribute name="font-size">22pt</xsl:attribute>
    <xsl:attribute name="font-weight">bold</xsl:attribute>
    <xsl:attribute name="space-before">0pt</xsl:attribute>
    <xsl:attribute name="space-after">18pt</xsl:attribute>
    <xsl:attribute name="color">#1e3a5f</xsl:attribute>
  </xsl:attribute-set>

  <!-- TOC chapter/part entries -->
  <xsl:attribute-set name="__toc__chapter__content">
    <xsl:attribute name="font-size">12pt</xsl:attribute>
    <xsl:attribute name="font-weight">bold</xsl:attribute>
    <xsl:attribute name="space-before">10pt</xsl:attribute>
    <xsl:attribute name="color">#1e3a5f</xsl:attribute>
  </xsl:attribute-set>

  <!-- TOC topic entries: comfortable line height -->
  <xsl:attribute-set name="__toc__topic__content">
    <xsl:attribute name="font-size">11pt</xsl:attribute>
    <xsl:attribute name="space-before">4pt</xsl:attribute>
    <xsl:attribute name="line-height">15pt</xsl:attribute>
  </xsl:attribute-set>

  <!-- Deeper TOC levels -->
  <xsl:attribute-set name="__toc__topic__content_2">
    <xsl:attribute name="font-size">10pt</xsl:attribute>
    <xsl:attribute name="space-before">2pt</xsl:attribute>
    <xsl:attribute name="start-indent">from-parent(start-indent) + 18pt</xsl:attribute>
  </xsl:attribute-set>

  <!-- ============================================================= -->
  <!--  FILEPATH, UI, KEYWORD highlights                             -->
  <!-- ============================================================= -->

  <!-- File paths -->
  <xsl:attribute-set name="filepath">
    <xsl:attribute name="font-family">Courier, monospace</xsl:attribute>
    <xsl:attribute name="font-size">0.9em</xsl:attribute>
    <xsl:attribute name="background-color">#f1f5f9</xsl:attribute>
    <xsl:attribute name="color">#7c3aed</xsl:attribute>
    <xsl:attribute name="padding-start">2pt</xsl:attribute>
    <xsl:attribute name="padding-end">2pt</xsl:attribute>
  </xsl:attribute-set>

  <!-- UI controls (menu items, buttons) -->
  <xsl:attribute-set name="uicontrol">
    <xsl:attribute name="font-weight">bold</xsl:attribute>
  </xsl:attribute-set>

  <!-- Menu cascade separator -->
  <xsl:attribute-set name="menucascade">
    <xsl:attribute name="font-weight">bold</xsl:attribute>
  </xsl:attribute-set>

</xsl:stylesheet>
