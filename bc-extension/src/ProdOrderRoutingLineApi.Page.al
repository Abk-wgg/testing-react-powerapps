// API page over the standard "Prod. Order Routing Line" table (5410) — the
// production order operations, each tied to a work center / machine center.
//
// Publishing this extension makes the data available as a Business Central
// Dataverse virtual table, so a Power Apps code app can read it through the
// existing Dataverse connection (no Entra app registration required).
//
// After publishing, enable the table in the BC -> Dataverse virtual-tables
// screen (set Visible + Refresh). It will appear with a logical name along the
// lines of `prodorderroutinglines_abk_prod_v1_0`.
page 51103 "ABK Prod Order Routing API"
{
    PageType = API;
    Caption = 'prodOrderRoutingLine';
    APIPublisher = 'abk';
    APIGroup = 'prod';
    APIVersion = 'v1.0';
    EntityName = 'prodOrderRoutingLine';
    EntitySetName = 'prodOrderRoutingLines';
    SourceTable = "Prod. Order Routing Line"; // table 5410
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
                field(routingReferenceNo; Rec."Routing Reference No.") { Caption = 'routingReferenceNo'; }
                field(routingNo; Rec."Routing No.") { Caption = 'routingNo'; }
                field(operationNo; Rec."Operation No.") { Caption = 'operationNo'; }
                field(type; Rec.Type) { Caption = 'type'; }
                field(no; Rec."No.") { Caption = 'no'; }
                field(workCenterNo; Rec."Work Center No.") { Caption = 'workCenterNo'; }
                field(workCenterGroupCode; Rec."Work Center Group Code") { Caption = 'workCenterGroupCode'; }
                field(description; Rec.Description) { Caption = 'description'; }
                field(setupTime; Rec."Setup Time") { Caption = 'setupTime'; }
                field(runTime; Rec."Run Time") { Caption = 'runTime'; }
                field(expectedCapacityNeed; Rec."Expected Capacity Need") { Caption = 'expectedCapacityNeed'; }
                field(routingStatus; Rec."Routing Status") { Caption = 'routingStatus'; }
                field(startingDate; Rec."Starting Date") { Caption = 'startingDate'; }
                field(endingDate; Rec."Ending Date") { Caption = 'endingDate'; }
                field(nextOperationNo; Rec."Next Operation No.") { Caption = 'nextOperationNo'; }
            }
        }
    }
}
