// API page over the standard "Production Order" table (5405) — the order header.
//
// Publishing this extension makes the data available as a Business Central
// Dataverse virtual table, so a Power Apps code app can read it through the
// existing Dataverse connection (no Entra app registration required).
//
// After publishing, enable the table in the BC -> Dataverse virtual-tables
// screen (set Visible + Refresh). It will appear with a logical name along the
// lines of `productionorders_abk_prod_v1_0`.
page 51101 "ABK Production Order API"
{
    PageType = API;
    Caption = 'productionOrder';
    APIPublisher = 'abk';
    APIGroup = 'prod';
    APIVersion = 'v1.0';
    EntityName = 'productionOrder';
    EntitySetName = 'productionOrders';
    SourceTable = "Production Order"; // table 5405
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
                field(no; Rec."No.") { Caption = 'no'; }
                field(description; Rec.Description) { Caption = 'description'; }
                field(searchDescription; Rec."Search Description") { Caption = 'searchDescription'; }
                field(sourceType; Rec."Source Type") { Caption = 'sourceType'; }
                field(sourceNo; Rec."Source No.") { Caption = 'sourceNo'; }
                field(routingNo; Rec."Routing No.") { Caption = 'routingNo'; }
                field(quantity; Rec.Quantity) { Caption = 'quantity'; }
                field(dueDate; Rec."Due Date") { Caption = 'dueDate'; }
                field(startingDate; Rec."Starting Date") { Caption = 'startingDate'; }
                field(startingTime; Rec."Starting Time") { Caption = 'startingTime'; }
                field(endingDate; Rec."Ending Date") { Caption = 'endingDate'; }
                field(endingTime; Rec."Ending Time") { Caption = 'endingTime'; }
                field(finishedDate; Rec."Finished Date") { Caption = 'finishedDate'; }
                field(creationDate; Rec."Creation Date") { Caption = 'creationDate'; }
                field(lastDateModified; Rec."Last Date Modified") { Caption = 'lastDateModified'; }
                field(locationCode; Rec."Location Code") { Caption = 'locationCode'; }
                field(binCode; Rec."Bin Code") { Caption = 'binCode'; }
                field(inventoryPostingGroup; Rec."Inventory Posting Group") { Caption = 'inventoryPostingGroup'; }
                field(genProdPostingGroup; Rec."Gen. Prod. Posting Group") { Caption = 'genProdPostingGroup'; }
                field(assignedUserId; Rec."Assigned User ID") { Caption = 'assignedUserId'; }
                field(lowLevelCode; Rec."Low-Level Code") { Caption = 'lowLevelCode'; }
            }
        }
    }
}
