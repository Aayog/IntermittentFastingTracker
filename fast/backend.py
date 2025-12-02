import datetime

def get_fasting_phase(elapsed_hours):
    """
    Determines the current intermittent fasting phase based on elapsed hours.

    Args:
        elapsed_hours (float): The number of hours elapsed since the fast started.

    Returns:
        dict: A dictionary containing the name and description of the current phase.
              Returns the phase that corresponds to the highest threshold met or exceeded.
    """

    # Define the different intermittent fasting phases.
    # Each phase has a name, a description, and a 'threshold_hours' indicating
    # the minimum hours of fasting required to enter or be in that phase.
    fasting_phases = [
        {
            "name": "Anabolic",
            "description": "Your body is still digesting and absorbing nutrients from your last meal. Insulin levels are elevated.",
            "threshold_hours": 0
        },
        {
            "name": "Catabolic / Glycogen Depletion",
            "description": "Your body starts to deplete its glycogen stores (stored glucose). Insulin levels begin to drop.",
            "threshold_hours": 4
        },
        {
            "name": "Fat Burning / Ketosis",
            "description": "Glycogen stores are significantly depleted. Your body switches to burning stored fat for energy, and ketone production begins.",
            "threshold_hours": 12
        },
        {
            "name": "Autophagy / Growth Hormone Boost",
            "description": "Cellular repair processes (autophagy) become more active. Growth hormone levels start to increase, aiding in fat loss and muscle preservation.",
            "threshold_hours": 18
        },
        {
            "name": "Deep Autophagy / Immune Regeneration",
            "description": "Autophagy is significantly enhanced. Your body may start regenerating immune cells (lymphocytes).",
            "threshold_hours": 24
        },
        {
            "name": "Advanced Autophagy / Stem Cell Activation",
            "description": "Autophagy continues at a high level. Potential for stem cell activation and deeper cellular rejuvenation.",
            "threshold_hours": 48
        }
    ]

    # Sort phases by their threshold hours in ascending order.
    # This ensures that when iterating, we correctly identify the highest phase achieved.
    sorted_phases = sorted(fasting_phases, key=lambda x: x["threshold_hours"])

    # Initialize current_phase with the very first phase (0 hours).
    current_phase = sorted_phases[0]

    # Iterate through the sorted phases to find the appropriate one.
    for phase in sorted_phases:
        # If the elapsed hours are greater than or equal to the current phase's threshold,
        # then this phase (or a later one) is the current active phase.
        if elapsed_hours >= phase["threshold_hours"]:
            current_phase = phase
        else:
            # If elapsed hours are less than the current phase's threshold,
            # it means we have passed the correct phase in the previous iteration.
            # So, we break the loop as we've found our phase.
            break

    return current_phase

# This block will execute only when the script is run directly (not imported as a module).
if __name__ == "__main__":
    print("--- Intermittent Fasting Phase Calculator (Python) ---")

    # Example usage: Test with various elapsed hours
    test_hours = [0, 2, 5, 10, 15, 20, 25, 30, 40, 50]

    for hours in test_hours:
        phase = get_fasting_phase(hours)
        print(f"\nElapsed Hours: {hours}")
        print(f"  Phase Name: {phase['name']}")
        print(f"  Description: {phase['description']}")

    # Conceptual simulation of a running timer
    print("\n--- Simulating a running timer (conceptual) ---")
    start_time = datetime.datetime.now()
    print(f"Fast started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")

    # Define a few points in time to simulate elapsed duration
    simulation_points = [
        datetime.timedelta(hours=3),   # Example: 3 hours into the fast
        datetime.timedelta(hours=13),  # Example: 13 hours into the fast (Fat Burning)
        datetime.timedelta(hours=22),  # Example: 22 hours into the fast (Autophagy)
        datetime.timedelta(hours=49)   # Example: 49 hours into the fast (Advanced Autophagy)
    ]

    for delta in simulation_points:
        current_time = start_time + delta
        elapsed_duration = current_time - start_time
        # Convert total seconds of elapsed duration to hours
        elapsed_hours = elapsed_duration.total_seconds() / 3600
        phase = get_fasting_phase(elapsed_hours)
        print(f"\nAt {current_time.strftime('%H:%M:%S')} (Elapsed: {elapsed_hours:.2f} hours):")
        print(f"  Current Phase: {phase['name']}")
        print(f"  Description: {phase['description']}")
