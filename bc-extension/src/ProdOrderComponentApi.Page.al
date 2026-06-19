// API page over the standard "Prod. Order Component" table (5407).
//
// Publishing this extension makes the data available as a Business Central
// Dataverse virtual table, so a Power Apps code app can read it through the
// existing Dataverse connection (no Entra app registration required).
//
// After publishing, enable the table in the BC -> Dataverse virtual-tables
// screen (set Visible + Refresh). It will appear with a logical name along the
// lines of `prodordercomponents_abk_prod_v1_0`.
page 51100 "ABK Prod Order Comp API"
{
    PageType = API;
    Caption = 'prodOrderComponent';
    APIPublisher = 'abk';
    APIGroup = 'prod';
    APIVersion = 'v1.0';
    EntityName = 'prodOrderComponent';
    EntitySetName = 'prodOrderComponents';
    SourceTable = "Prod. Order Component"; // table 5407
    DelayedInsert = true;
    ODataKeyFields = SystemId;
    Editable = false;
    Extensible = false;

    layout
    {
        area(Content)
        {
            repeater(General)
            {
                field(systemId; Rec.SystemId)
                {
                    Caption = 'systemId';
                    Editable = false;
                }
                field(status; Rec.Status) { Caption = 'status'; }
                field(prodOrderNo; Rec."Prod. Order No.") { Caption = 'prodOrderNo'; }
                field(prodOrderLineNo; Rec."Prod. Order Line No.") { Caption = 'prodOrderLineNo'; }
                field(lineNo; Rec."Line No.") { Caption = 'lineNo'; }
                field(itemNo; Rec."Item No.") { Caption = 'itemNo'; }
                field(description; Rec.Description) { Caption = 'description'; }
                field(unitOfMeasureCode; Rec."Unit of Measure Code") { Caption = 'unitOfMeasureCode'; }
                field(quantityPer; Rec."Quantity per") { Caption = 'quantityPer'; }
                field(quantity; Rec.Quantity) { Caption = 'quantity'; }
                field(remainingQuantity; Rec."Remaining Quantity") { Caption = 'remainingQuantity'; }
                field(expectedQuantity; Rec."Expected Quantity") { Caption = 'expectedQuantity'; }
                field(locationCode; Rec."Location Code") { Caption = 'locationCode'; }
                field(binCode; Rec."Bin Code") { Caption = 'binCode'; }
                field(variantCode; Rec."Variant Code") { Caption = 'variantCode'; }
                field(dueDate; Rec."Due Date") { Caption = 'dueDate'; }
            }
        }
    }
}
