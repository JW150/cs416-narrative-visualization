import pandas as pd
import json

# Define the list of files to process
file_list = ['us-counties-2020.csv', 'us-counties-2021.csv', 'us-counties-2022.csv', 'us-counties-2023.csv']

# Define the selected states
selected_states = ['California', 'Texas', 'Florida', 'New York', 'Pennsylvania']

# Initialize an empty DataFrame to hold all processed data
all_data = pd.DataFrame()

# Process each file
for file in file_list:
    # Load the CSV file into a DataFrame
    df = pd.read_csv(file)
    
    # Step 1: Select all records belonging to specified states
    df_selected = df[df['state'].isin(selected_states)]
    
    # Step 2: Drop unwanted columns
    df_selected = df_selected.drop(columns=['geoid', 'county', 'cases_avg', 'cases_avg_per_100k', 'deaths_avg', 'deaths_avg_per_100k'])
    
    # Step 3: Sum up the cases and deaths of all records in the same day
    df_grouped = df_selected.groupby(['date', 'state']).agg({'cases': 'sum', 'deaths': 'sum'}).reset_index()
    
    # Append the processed data to the all_data DataFrame
    all_data = pd.concat([all_data, df_grouped], ignore_index=True)

# Sort the data by date and state
all_data = all_data.sort_values(by=['state', 'date'])

# Step 4: Create accumulated cases and deaths columns
all_data['accumulated_cases'] = all_data.groupby('state')['cases'].cumsum()
all_data['accumulated_deaths'] = all_data.groupby('state')['deaths'].cumsum()

# Organize the data into the desired JSON format
json_data = []
for date in all_data['date'].unique():
    day_data = {
        "date": date,
        "states": []
    }
    for state in all_data['state'].unique():
        state_data = all_data[(all_data['date'] == date) & (all_data['state'] == state)]
        if not state_data.empty:
            state_record = {
                "state": state,
                "cases": int(state_data['cases']),
                "deaths": int(state_data['deaths']),
                "accumulated_cases": int(state_data['accumulated_cases']),
                "accumulated_deaths": int(state_data['accumulated_deaths'])
            }
            day_data["states"].append(state_record)
    json_data.append(day_data)

# Save the JSON data to a file
with open('processed_data.json', 'w') as json_file:
    json.dump(json_data, json_file, indent=4)

# Display a sample of the JSON data
print(json.dumps(json_data, indent=4))
