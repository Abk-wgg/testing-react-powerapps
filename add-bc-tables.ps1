# Probe-add all BC virtual tables from the catalog screenshots.
# Only tables provisioned as Dataverse virtual entities will succeed; the rest fail harmlessly.
# Logical name = "dyn365bc_" + the catalog's "Dataverse Table Logical Name".

$names = @(
  # --- v2.0 route ---
  'account_v2_0','accountingperiod_v2_0','agedaccountspayable_v2_0','agedaccountsreceivable_v2_0',
  'applyvendorentry_v2_0','attachment_v2_0','balancesheet_v2_0','bankaccount_v2_0','cashflowstatement_v2_0',
  'companyinformation_v2_0','contact_v2_0','contactinformation_v2_0','countryregion_v2_0','currency_v2_0',
  'currencyexchangerate_v2_0','customer_v2_0','customercontact_v2_0','customerfinancialdetail_v2_0',
  'customerpayment_v2_0','customerpaymentjournal_v2_0','customerreturnreason_v2_0','customersale_v2_0',
  'defaultdimension_v2_0','dimension_v2_0','dimensionsetline_v2_0','dimensionvalue_v2_0','disputestatus_v2_0',
  'documentattachment_v2_0','employee_v2_0','fixedasset_v2_0','fixedassetlocation_v2_0','generalledgerentry_v2_0',
  'generalledgersetup_v2_0','generalproductpostinggroup_v2_0','incomestatement_v2_0','inventorypostinggroup_v2_0',
  'item_v2_0','itemcategory_v2_0','itemledgerentry_v2_0','itemvariant_v2_0','jobqueueentry_v2_0',
  'jobqueuelogentry_v2_0','journal_v2_0','journalline_v2_0','location_v2_0','opportunity_v2_0','paymentmethod_v2_0',
  'paymentterm_v2_0','picture_v2_0','project_v2_0','purchasecreditmemo_v2_0','purchasecreditmemoline_v2_0',
  'purchaseinvoice_v2_0','purchaseinvoiceline_v2_0','purchaseorder_v2_0','purchaseorderline_v2_0',
  'purchasereceipt_v2_0','purchasereceiptline_v2_0','retainedearningsstatement_v2_0','salescreditmemo_v2_0',
  'salescreditmemoline_v2_0','salesinvoice_v2_0','salesinvoiceline_v2_0','salesorder_v2_0','salesorderline_v2_0',
  'salespersonpurchaser_v2_0','salesquote_v2_0','salesquoteline_v2_0','salesshipment_v2_0','salesshipmentline_v2_0',
  'shipmentmethod_v2_0','taxarea_v2_0','taxgroup_v2_0','timeregistrationentry_v2_0','trialbalance_v2_0',
  'unitofmeasure_v2_0','vendor_v2_0','vendorpayment_v2_0','vendorpaymentjournal_v2_0','vendorpurchase_v2_0',
  # --- pb365base/powerbi/v1.0 route ---
  'accountperiod_pb365base_powerbi_v1_0','accountscheduleline_pb365base_powerbi_v1_0','countryregion_pb365base_powerbi_v1_0',
  'customer_pb365base_powerbi_v1_0','customerledgerentry_pb365base_powerbi_v1_0','detailedcustomerledgerentry_pb365base_powerbi_v1_0',
  'detailedvendorledgerentry_pb365base_powerbi_v1_0','dimensionsetentry_pb365base_powerbi_v1_0','dimensionvalue_pb365base_powerbi_v1_0',
  'glaccount_pb365base_powerbi_v1_0','glbudgetentry_pb365base_powerbi_v1_0','glbudgetname_pb365base_powerbi_v1_0',
  'glentry_pb365base_powerbi_v1_0','glentryvatentrylink_pb365base_powerbi_v1_0','glitemledgerrelation_pb365base_powerbi_v1_0',
  'item_pb365base_powerbi_v1_0','itemledgerentry_pb365base_powerbi_v1_0','purchasecreditmemoheader_pb365base_powerbi_v1_0',
  'purchasecreditmemoline_pb365base_powerbi_v1_0','purchaseheaderblanketorder_pb365base_powerbi_v1_0',
  'purchaseheadercreditmemo_pb365base_powerbi_v1_0','purchaseheaderinvoice_pb365base_powerbi_v1_0',
  'purchaseheaderorder_pb365base_powerbi_v1_0','purchaseheaderquote_pb365base_powerbi_v1_0',
  'purchaseheaderreturnorder_pb365base_powerbi_v1_0','purchaseinvoiceheader_pb365base_powerbi_v1_0',
  'purchaseinvoiceline_pb365base_powerbi_v1_0','purchaselineblanketorder_pb365base_powerbi_v1_0',
  'purchaselinecreditmemo_pb365base_powerbi_v1_0','purchaselineinvoice_pb365base_powerbi_v1_0',
  'purchaselineorder_pb365base_powerbi_v1_0','purchaselinequote_pb365base_powerbi_v1_0',
  'purchaselinereturnorder_pb365base_powerbi_v1_0','purchasereceiptheader_pb365base_powerbi_v1_0',
  'purchasereceiptline_pb365base_powerbi_v1_0','reminderchargeentry_pb365base_powerbi_v1_0','reminderheader_pb365base_powerbi_v1_0',
  'resource_pb365base_powerbi_v1_0','returnreceiptheader_pb365base_powerbi_v1_0','returnreceiptline_pb365base_powerbi_v1_0',
  'returnshipmentheader_pb365base_powerbi_v1_0','returnshipmentline_pb365base_powerbi_v1_0','salescreditmemoheader_pb365base_powerbi_v1_0',
  'salescreditmemoline_pb365base_powerbi_v1_0','salesheaderblanketorder_pb365base_powerbi_v1_0','salesheadercreditmemo_pb365base_powerbi_v1_0',
  'salesheaderinvoice_pb365base_powerbi_v1_0','salesheaderorder_pb365base_powerbi_v1_0','salesheaderquote_pb365base_powerbi_v1_0',
  'salesheaderreturnorder_pb365base_powerbi_v1_0','salesinvoiceheader_pb365base_powerbi_v1_0','salesinvoiceline_pb365base_powerbi_v1_0',
  'saleslineblanketorder_pb365base_powerbi_v1_0','saleslinecreditmemo_pb365base_powerbi_v1_0','saleslineinvoice_pb365base_powerbi_v1_0',
  'saleslineorder_pb365base_powerbi_v1_0','saleslinequote_pb365base_powerbi_v1_0','saleslinereturnorder_pb365base_powerbi_v1_0',
  'salespersonpurchaser_pb365base_powerbi_v1_0','salesshipmentheader_pb365base_powerbi_v1_0','salesshipmentline_pb365base_powerbi_v1_0',
  'valueentry_pb365base_powerbi_v1_0','vatentry_pb365base_powerbi_v1_0','vendor_pb365base_powerbi_v1_0','vendorledgerentry_pb365base_powerbi_v1_0',
  # --- tecvia/sales/v2.0 route ---
  'items_tecvia_sales_v2_0','saleslines_tecvia_sales_v2_0','salesorder_tecvia_sales_v2_0'
)

$added = @(); $skipped = @()
$i = 0
foreach ($n in $names) {
  $i++
  $t = "dyn365bc_$n"
  $out = pac code add-data-source -a dataverse -t $t 2>&1 | Out-String
  if ($out -match 'added successfully') {
    $added += $t
    Write-Host "[$i/$($names.Count)] ADDED   $t"
  } else {
    $skipped += $t
    Write-Host "[$i/$($names.Count)] skip    $t"
  }
}

Write-Host ""
Write-Host "================ SUMMARY ================"
Write-Host "ADDED ($($added.Count)):"
$added | ForEach-Object { Write-Host "  $_" }
Write-Host ""
Write-Host "SKIPPED/not provisioned ($($skipped.Count)): $($skipped.Count) tables"
