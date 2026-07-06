module {
  public func migration(_old : {}) : { maintenanceMode : { var enabled : Bool } } {
    { maintenanceMode = { var enabled = false } };
  };
};