import pandas as pd
import json

# Define the list of files to process
file_list = ['us-counties-2020.csv', 'us-counties-2021.csv', 'us-counties-2022.csv', 'us-counties-2023.csv']

# Initialize an empty DataFrame to hold all processed data
all_data = pd.DataFrame()

# Process each file
for file in file_list:
    # Load the CSV file into a DataFrame
    df = pd.read_csv(file)
    
    # Drop unwanted columns
    df = df.drop(columns=['geoid', 'county', 'cases_avg', 'cases_avg_per_100k', 'deaths_avg', 'deaths_avg_per_100k'])
    
    # Sum up the cases and deaths of all records in the same day
    df_grouped = df.groupby(['date', 'state']).agg({'cases': 'sum', 'deaths': 'sum'}).reset_index()
    
    # Append the processed data to the all_data DataFrame
    all_data = pd.concat([all_data, df_grouped], ignore_index=True)

# Sort the data by state and date
all_data = all_data.sort_values(by=['state', 'date'])

# Create accumulated cases and deaths columns
all_data['accumulated_cases'] = all_data.groupby('state')['cases'].cumsum()
all_data['accumulated_deaths'] = all_data.groupby('state')['deaths'].cumsum()

# Organize the data into the desired JSON format
json_data = {}
for state in all_data['state'].unique():
    state_data = all_data[all_data['state'] == state]
    records = []
    for _, row in state_data.iterrows():
        record = {
            "date": row['date'],
            "cases": int(row['cases']),
            "deaths": int(row['deaths']),
            "accumulated_cases": int(row['accumulated_cases']),
            "accumulated_deaths": int(row['accumulated_deaths'])
        }
        records.append(record)
    json_data[state] = records

# Save the JSON data to a file
with open('processed_data.json', 'w') as json_file:
    json.dump(json_data, json_file, indent=4)

# Display a sample of the JSON data
print(json.dumps(json_data, indent=4))
